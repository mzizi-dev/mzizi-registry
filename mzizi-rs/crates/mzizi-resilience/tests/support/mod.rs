//! A virtual runtime for the resilience tests: a clock and timers that move only when the
//! executor fires the next timer, in (deadline, order armed) order, one at a time, with every
//! woken future re-polled in between. That is the order the TypeScript suite's VirtualTime
//! gives, so the shared fixtures' tie rules hold in both builds.

#![allow(dead_code)]

use std::cell::RefCell;
use std::collections::BTreeSet;
use std::future::Future;
use std::pin::{Pin, pin};
use std::rc::Rc;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::task::{Context, Poll, Wake, Waker};

use mzizi_resilience::Runtime;

#[derive(Default)]
struct State {
    now: u64,
    seq: u64,
    armed: BTreeSet<(u64, u64)>,
    fired: BTreeSet<(u64, u64)>,
}

/// The virtual clock and timer.
#[derive(Clone, Default)]
pub struct Virtual {
    state: Rc<RefCell<State>>,
}

impl Virtual {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn now(&self) -> u64 {
        self.state.borrow().now
    }

    /// Timers still armed (a dropped sleep disarms its timer).
    pub fn pending(&self) -> usize {
        self.state.borrow().armed.len()
    }

    /// Move the clock to `t` between calls; nothing may be armed before it.
    pub fn advance_to(&self, t: u64) {
        let mut s = self.state.borrow_mut();
        assert!(t >= s.now, "time cannot go back from {} to {t}", s.now);
        assert!(
            s.armed.iter().all(|(at, _)| *at >= t),
            "advancing past an armed timer"
        );
        s.now = t;
    }

    fn fire_next(&self) -> bool {
        let mut s = self.state.borrow_mut();
        let Some(next) = s.armed.iter().next().copied() else {
            return false;
        };
        s.armed.remove(&next);
        s.now = s.now.max(next.0);
        s.fired.insert(next);
        true
    }
}

pub struct VirtualSleep {
    state: Rc<RefCell<State>>,
    ms: u64,
    key: Option<(u64, u64)>,
}

impl Future for VirtualSleep {
    type Output = ();
    fn poll(mut self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<()> {
        let state = Rc::clone(&self.state);
        let mut s = state.borrow_mut();
        match self.key {
            None => {
                let key = (s.now + self.ms, s.seq);
                s.seq += 1;
                s.armed.insert(key);
                self.key = Some(key);
                Poll::Pending
            }
            Some(key) => {
                if s.fired.remove(&key) {
                    drop(s);
                    self.key = None;
                    self.ms = u64::MAX; // spent
                    Poll::Ready(())
                } else {
                    Poll::Pending
                }
            }
        }
    }
}

impl Drop for VirtualSleep {
    fn drop(&mut self) {
        if let Some(key) = self.key {
            let mut s = self.state.borrow_mut();
            s.armed.remove(&key);
            s.fired.remove(&key);
        }
    }
}

impl Runtime for Virtual {
    fn now_ms(&self) -> u64 {
        self.now()
    }
    fn sleep(&self, ms: u64) -> impl Future<Output = ()> {
        VirtualSleep {
            state: Rc::clone(&self.state),
            ms,
            key: None,
        }
    }
}

struct Flag(AtomicBool);

impl Wake for Flag {
    fn wake(self: Arc<Self>) {
        self.0.store(true, Ordering::SeqCst);
    }
}

/// Drive `fut` on virtual time until it completes.
pub fn block_on<F: Future>(rt: &Virtual, fut: F) -> F::Output {
    let flag = Arc::new(Flag(AtomicBool::new(false)));
    let waker = Waker::from(Arc::clone(&flag));
    let mut cx = Context::from_waker(&waker);
    let mut fut = pin!(fut);
    for _ in 0..1_000_000 {
        flag.0.store(false, Ordering::SeqCst);
        if let Poll::Ready(v) = fut.as_mut().poll(&mut cx) {
            return v;
        }
        if flag.0.load(Ordering::SeqCst) {
            continue;
        }
        assert!(
            rt.fire_next(),
            "deadlock: the future is pending and no timer is armed"
        );
    }
    panic!("virtual time did not settle");
}

/// Poll every future until all complete; results in order.
pub async fn join_all<F: Future>(futs: Vec<F>) -> Vec<F::Output> {
    let mut futs: Vec<Pin<Box<F>>> = futs.into_iter().map(Box::pin).collect();
    let mut out: Vec<Option<F::Output>> = futs.iter().map(|_| None).collect();
    std::future::poll_fn(|cx| {
        let mut done = true;
        for (i, f) in futs.iter_mut().enumerate() {
            if out[i].is_none() {
                match f.as_mut().poll(cx) {
                    Poll::Ready(v) => out[i] = Some(v),
                    Poll::Pending => done = false,
                }
            }
        }
        if done { Poll::Ready(()) } else { Poll::Pending }
    })
    .await;
    out.into_iter().map(|o| o.expect("completed")).collect()
}
