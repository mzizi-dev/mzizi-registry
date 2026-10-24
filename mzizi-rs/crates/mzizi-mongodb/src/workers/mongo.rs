//! MongoDB on a Worker: a connection that lives as long as the isolate does.
//!
//! `Mongo::new(uri)` takes the connection string (a secret, read by the
//! calling Worker). Each operation takes the pooled connection, or connects:
//! the first seed host that answers `hello` and accepts the SCRAM login is
//! used, any member of the replica set is fine for the secondary-preferred
//! reads. If a reused connection fails (the platform closed it, or it belongs
//! to a finished request, which a Worker may not use), it is dropped and the
//! operation runs once more on a fresh one. Errors never carry the string.

use std::cell::RefCell;

use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use serde_json::Value;
use worker::Socket;
use worker::wasm_bindgen::JsCast;

use crate::conn::{Connection, FindOptions, SaltCache};
use crate::uri::{self, Uri};
use crate::{Error, Result};
use mzizi_data::workers::{SocketIo, within};

type Conn = Connection<SocketIo>;

thread_local! {
    /// The connection kept for the next operation, with the login it was
    /// authenticated with ([`Uri::same_login`] decides whether it may be reused).
    static POOL: RefCell<Option<(Uri, Conn)>> = const { RefCell::new(None) };
    static SALTS: RefCell<SaltCache> = RefCell::new(SaltCache::new());
}

fn random_nonce() -> Result<String> {
    let fail = || Error::Auth("no secure random source".into());
    let global = js_sys::global();
    let crypto = js_sys::Reflect::get(&global, &"crypto".into()).map_err(|_| fail())?;
    let get: js_sys::Function = js_sys::Reflect::get(&crypto, &"getRandomValues".into())
        .map_err(|_| fail())?
        .dyn_into()
        .map_err(|_| fail())?;
    let bytes = js_sys::Uint8Array::new_with_length(24);
    get.call1(&crypto, &bytes).map_err(|_| fail())?;
    let mut raw = [0u8; 24];
    bytes.copy_to(&mut raw);
    Ok(B64.encode(raw))
}

async fn connect_one(uri: &Uri, app: Option<&str>, host: &str, port: u16) -> Result<Conn> {
    let socket = Socket::builder()
        .secure_transport(worker::SecureTransport::On)
        .connect(host.to_owned(), port)
        .map_err(|e| Error::Io(e.to_string()))?;
    within("connect", socket.opened())
        .await?
        .map_err(|e| Error::Io(e.to_string()))?;
    let mut conn = Connection::new(SocketIo::new(socket));
    if let Some(app) = app {
        conn = conn.with_app_name(app);
    }
    conn.hello().await?;
    let nonce = random_nonce()?;
    // The salted password is cached for the isolate; take the cache out of
    // the thread-local for the await.
    let mut salts = SALTS.with(|s| std::mem::take(&mut *s.borrow_mut()));
    let auth = conn.authenticate(uri, &nonce, &mut salts).await;
    SALTS.with(|s| *s.borrow_mut() = salts);
    auth?;
    Ok(conn)
}

async fn connect(uri: &Uri, app: Option<&str>) -> Result<Conn> {
    let mut last = Error::Io("no host".into());
    for (host, port) in &uri.hosts {
        match connect_one(uri, app, host, *port).await {
            Ok(c) => return Ok(c),
            // A refused login will not improve on another member.
            Err(e @ Error::Auth(_)) => return Err(e),
            Err(e) => last = e,
        }
    }
    Err(last)
}

enum Op<'a> {
    Ping(&'a str),
    Find(&'a str, &'a str, &'a FindOptions),
    Aggregate(&'a str, &'a str, &'a [Value], &'a [&'a str]),
}

async fn exec(conn: &mut Conn, op: &Op<'_>) -> Result<Vec<Value>> {
    match op {
        Op::Ping(db) => conn.ping(db).await.map(|()| Vec::new()),
        Op::Find(db, coll, opts) => conn.find(db, coll, opts).await,
        Op::Aggregate(db, coll, pipeline, joins) => {
            conn.aggregate_joining(db, coll, pipeline, joins).await
        }
    }
}

/// An error that says the connection, not the question, is the problem.
fn connection_broke(e: &Error) -> bool {
    matches!(e, Error::Io(_) | Error::Timeout(_) | Error::Protocol(_))
}

/// A read-only MongoDB client.
pub struct Mongo {
    uri: Uri,
    app: Option<String>,
}

impl Mongo {
    /// From the seed-list connection string.
    pub fn new(connection_string: &str) -> Result<Mongo> {
        Ok(Mongo {
            uri: uri::parse(connection_string)?,
            app: None,
        })
    }

    /// Name the application in the handshake of each new connection
    /// ([`Connection::with_app_name`]).
    #[must_use]
    pub fn with_app_name(mut self, name: &str) -> Mongo {
        self.app = Some(name.to_owned());
        self
    }

    /// The database named in the connection string, if any.
    pub fn default_database(&self) -> Option<&str> {
        self.uri.database.as_deref()
    }

    async fn run(&self, op: Op<'_>) -> Result<Vec<Value>> {
        let pooled = POOL.with(|p| p.borrow_mut().take());
        let (mut conn, reused) = match pooled {
            Some((login, c)) if login.same_login(&self.uri) => (c, true),
            _ => (connect(&self.uri, self.app.as_deref()).await?, false),
        };
        let first = exec(&mut conn, &op).await;
        let result = match first {
            Err(e) if reused && connection_broke(&e) => {
                drop(conn);
                conn = connect(&self.uri, self.app.as_deref()).await?;
                exec(&mut conn, &op).await
            }
            other => other,
        };
        // Keep the connection for the next operation unless it is broken.
        if !matches!(&result, Err(e) if connection_broke(e)) {
            POOL.with(|p| *p.borrow_mut() = Some((self.uri.clone(), conn)));
        }
        result
    }

    /// Connect (or reuse the connection) and `ping` database `db`: the live
    /// check that the string, the network path and the login all work.
    pub async fn ping(&self, db: &str) -> Result<()> {
        self.run(Op::Ping(db)).await.map(|_| ())
    }

    /// Documents matching `opts.filter` in `db.coll`, as JSON, capped at
    /// [`MAX_FIND_DOCS`](crate::conn::MAX_FIND_DOCS).
    pub async fn find(&self, db: &str, coll: &str, opts: &FindOptions) -> Result<Vec<Value>> {
        self.run(Op::Find(db, coll, opts)).await
    }

    /// The first document matching `filter` in `db.coll`, if any.
    pub async fn find_one(&self, db: &str, coll: &str, filter: Value) -> Result<Option<Value>> {
        let opts = FindOptions {
            filter,
            limit: 1,
            ..FindOptions::default()
        };
        Ok(self.find(db, coll, &opts).await?.into_iter().next())
    }

    /// Run a read-only aggregation `pipeline` on `db.coll`; `$out` and `$merge` are refused, and
    /// so is a stage that reads another collection ([`Connection::aggregate`]).
    pub async fn aggregate(&self, db: &str, coll: &str, pipeline: &[Value]) -> Result<Vec<Value>> {
        self.aggregate_joining(db, coll, pipeline, &[]).await
    }

    /// [`Mongo::aggregate`], where `$lookup`, `$graphLookup` and `$unionWith` may also read the
    /// collections in `joins` ([`Connection::aggregate_joining`]).
    pub async fn aggregate_joining(
        &self,
        db: &str,
        coll: &str,
        pipeline: &[Value],
        joins: &[&str],
    ) -> Result<Vec<Value>> {
        self.run(Op::Aggregate(db, coll, pipeline, joins)).await
    }
}
