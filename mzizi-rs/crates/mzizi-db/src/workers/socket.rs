//! A Worker's outbound TLS socket as an [`Io`](crate::io::Io) transport.

use std::time::Duration;

use futures::future::{Either, select};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use worker::{Delay, Socket};

use crate::io::Io;
use crate::{Error, Result};

/// Each read, write and connect gives up after this.
pub(crate) const IO_TIMEOUT: Duration = Duration::from_secs(6);

/// Run `fut`, or give up with [`Error::Timeout`] after [`IO_TIMEOUT`].
pub(crate) async fn within<T>(
    what: &'static str,
    fut: impl std::future::Future<Output = T>,
) -> std::result::Result<T, Error> {
    match select(Box::pin(fut), Box::pin(Delay::from(IO_TIMEOUT))).await {
        Either::Left((v, _)) => Ok(v),
        Either::Right(_) => Err(Error::Timeout(what)),
    }
}

/// A connected [`Socket`] speaking [`Io`], with a timeout on every read and write.
pub struct SocketIo {
    pub(crate) socket: Socket,
}

impl SocketIo {
    /// Wrap a socket that is already open.
    pub fn new(socket: Socket) -> Self {
        Self { socket }
    }
}

impl Io for SocketIo {
    async fn write_all(&mut self, buf: &[u8]) -> Result<()> {
        within("write", async {
            self.socket.write_all(buf).await?;
            self.socket.flush().await
        })
        .await?
        .map_err(|e| Error::Io(e.to_string()))
    }

    async fn read_exact(&mut self, n: usize) -> Result<Vec<u8>> {
        let mut buf = vec![0u8; n];
        within("read", self.socket.read_exact(&mut buf))
            .await?
            .map_err(|e| Error::Io(e.to_string()))?;
        Ok(buf)
    }
}
