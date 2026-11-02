//! One authenticated connection and the read-only commands.
//!
//! [`Connection`] is generic over a byte transport ([`Io`]): the Worker's
//! TLS socket in production (`edge`), a scripted in-memory server in the
//! tests, so the whole handshake, the SCRAM exchange and the cursor handling
//! run natively.
//!
//! The helpers are read-only on purpose: `find`, `find_one` and `aggregate`
//! (which refuses `$out` and `$merge`, and reads another collection only when
//! the caller names it). They send read preference
//! `secondaryPreferred` and a server-side time limit, cap the number of
//! documents returned, and validate database and collection names.

use std::collections::HashMap;

use serde_json::Value;
use subtle::ConstantTimeEq;
use zeroize::Zeroizing;

use crate::bson::{Bson, Doc};
use crate::scram;
use crate::uri::Uri;
use crate::wire;
use crate::{Error, Result};
use mzizi_data::io::Io;
use mzizi_harness::{self as harness, Event, Level, Shared, Value as Field};

/// Most documents `find` returns, whatever the caller asks.
pub const MAX_FIND_DOCS: usize = 1_000;
/// Most documents `aggregate` collects across all its batches.
pub const MAX_AGGREGATE_DOCS: usize = 5_000;
/// The server stops a command after this long.
const MAX_TIME_MS: i32 = 8_000;
/// MongoDB's own limit on `client.application.name` in the handshake.
pub const MAX_APP_NAME: usize = 128;
const BATCH: i32 = 1_000;

/// (user, salt, iterations).
type SaltKey = (String, Vec<u8>, u32);

/// The password an entry was derived from, and the salted password, both wiped from memory when
/// the entry is dropped (replaced, cleared, or with the cache).
type SaltEntry = (Zeroizing<Vec<u8>>, Zeroizing<[u8; 32]>);

/// PBKDF2 results kept per isolate, so a reconnect does not pay 4096
/// iterations again. The entry is keyed by user, salt and iterations and
/// remembers the password it was derived from: a different password under the
/// same key (a rotated secret) is compared in constant time, misses, and is
/// recomputed. The password is never hashed to build a key.
#[derive(Default)]
pub struct SaltCache(HashMap<SaltKey, SaltEntry>);

impl SaltCache {
    /// An empty cache.
    pub fn new() -> Self {
        Self::default()
    }

    fn get_or_compute(
        &mut self,
        user: &str,
        password: &str,
        salt: &[u8],
        iterations: u32,
    ) -> Result<Zeroizing<[u8; 32]>> {
        let key = (user.to_owned(), salt.to_vec(), iterations);
        if let Some((derived_for, v)) = self.0.get(&key) {
            if derived_for.len() == password.len()
                && bool::from(derived_for.as_slice().ct_eq(password.as_bytes()))
            {
                return Ok(v.clone());
            }
        }
        let v = scram::salted_password(password, salt, iterations)?;
        if self.0.len() > 8 {
            self.0.clear();
        }
        self.0.insert(
            key,
            (Zeroizing::new(password.as_bytes().to_vec()), v.clone()),
        );
        Ok(v)
    }
}

/// What a server says about itself in reply to `hello`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Hello {
    /// The member accepts writes.
    pub primary: bool,
    /// The member replicates from a primary.
    pub secondary: bool,
    /// The newest wire protocol version the server speaks.
    pub max_wire_version: i64,
}

/// The value under `key` in a document, if present.
pub fn get<'a>(d: &'a Doc, key: &str) -> Option<&'a Bson> {
    d.iter().find(|(k, _)| k == key).map(|(_, v)| v)
}

fn as_i64(v: &Bson) -> Option<i64> {
    match v {
        Bson::Int32(i) => Some(i64::from(*i)),
        Bson::Int64(i) => Some(*i),
        Bson::Double(f) if f.fract() == 0.0 => Some(*f as i64),
        _ => None,
    }
}

/// Operators that run JavaScript on the server. A read-only client has no use for them, and a
/// filter or pipeline built from a request must never be able to run code on the cluster.
const SERVER_JS: &[&str] = &["$where", "$function", "$accumulator"];

/// Whether `v` uses a [`SERVER_JS`] operator anywhere, at any depth.
fn runs_server_js(v: &Value) -> bool {
    match v {
        Value::Object(m) => m
            .iter()
            .any(|(k, v)| SERVER_JS.contains(&k.as_str()) || runs_server_js(v)),
        Value::Array(a) => a.iter().any(runs_server_js),
        _ => false,
    }
}

/// Whether a collection named in a cross-collection stage may be read: the aggregation's own
/// collection, or one the caller listed.
fn may_read(from: &Value, coll: &str, allowed: &[&str]) -> bool {
    // `from: {db, coll}` (another database) is never allowed; only a plain name is.
    from.as_str()
        .is_some_and(|f| f == coll || allowed.contains(&f))
}

/// Whether every `$lookup`, `$graphLookup` and `$unionWith` in `v`, at any depth (sub-pipelines
/// and `$facet` included), reads only `coll` or a collection in `allowed`.
fn reads_only(v: &Value, coll: &str, allowed: &[&str]) -> bool {
    match v {
        Value::Object(m) => m.iter().all(|(k, v)| {
            let stage_ok = match k.as_str() {
                // `$lookup` without `from` runs its pipeline on `$documents`, not a collection.
                "$lookup" => v
                    .as_object()
                    .is_some_and(|o| o.get("from").is_none_or(|f| may_read(f, coll, allowed))),
                "$graphLookup" => v
                    .as_object()
                    .and_then(|o| o.get("from"))
                    .is_some_and(|f| may_read(f, coll, allowed)),
                // `{$unionWith: "c"}` or `{$unionWith: {coll: "c", pipeline}}`; without `coll`
                // the pipeline starts from `$documents`.
                "$unionWith" => match v {
                    Value::String(_) => may_read(v, coll, allowed),
                    Value::Object(o) => o.get("coll").is_none_or(|f| may_read(f, coll, allowed)),
                    _ => false,
                },
                _ => true,
            };
            stage_ok && reads_only(v, coll, allowed)
        }),
        Value::Array(a) => a.iter().all(|v| reads_only(v, coll, allowed)),
        _ => true,
    }
}

/// Whether `v` holds a `$out` or `$merge` stage at any depth.
fn writes(v: &Value) -> bool {
    match v {
        Value::Object(m) => m
            .iter()
            .any(|(k, v)| k == "$out" || k == "$merge" || writes(v)),
        Value::Array(a) => a.iter().any(writes),
        _ => false,
    }
}

/// The text an [`Error::Server`] carries: a fixed description of the code, written here. The
/// server's own `errmsg` is never kept, because it can echo part of the query (an operator, a
/// field name, a value) or describe the cluster's internals.
pub fn server_message(code: i64) -> &'static str {
    match code {
        2 => "bad value",
        9 => "the command could not be parsed",
        11 => "the user was not found",
        13 => "not authorized",
        18 => "authentication failed",
        26 => "the namespace does not exist",
        40 | 168 => "an invalid pipeline stage or operator",
        43 => "the cursor was not found",
        50 => "the operation exceeded its time limit",
        59 => "command not found",
        91 | 11600 | 11602 => "the server is shutting down",
        189 => "the primary stepped down",
        262 => "the operation exceeded its time limit",
        292 => "the query exceeded its memory limit",
        10107 | 13435 => "the member is not primary",
        _ => "the command failed",
    }
}

fn name_ok(name: &str) -> bool {
    !name.is_empty()
        && name.len() <= 120
        && name
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'-' | b'.'))
}

/// One authenticated connection over a byte transport.
pub struct Connection<T: Io> {
    io: T,
    next_id: i32,
    harness: Shared,
    /// Set once [`Connection::authenticate`] succeeds; until then replies are capped at
    /// [`wire::MAX_PRE_AUTH_MESSAGE`].
    authenticated: bool,
    app_name: Option<String>,
}

impl<T: Io> Connection<T> {
    /// A connection over `io`; call [`Connection::hello`] and
    /// [`Connection::authenticate`] before any command.
    pub fn new(io: T) -> Self {
        Connection {
            io,
            next_id: 1,
            harness: harness::noop(),
            authenticated: false,
            app_name: None,
        }
    }

    /// Name the application in the `hello` handshake (`client.application.name`), which the
    /// server shows in its logs and `currentOp`. Cut to [`MAX_APP_NAME`] bytes, MongoDB's limit.
    /// Without one, only the driver is named.
    #[must_use]
    pub fn with_app_name(mut self, name: &str) -> Self {
        let mut end = name.len().min(MAX_APP_NAME);
        while !name.is_char_boundary(end) {
            end -= 1;
        }
        self.app_name = (end > 0).then(|| name[..end].to_owned());
        self
    }

    /// Report each command and refusal to `harness`. Without one, nothing is reported.
    #[must_use]
    pub fn with_harness(mut self, harness: Shared) -> Self {
        self.harness = harness;
        self
    }

    /// Report a refusal and return it. `reason` is a fixed word, never caller data.
    fn refuse(&self, reason: &'static str, message: &str) -> Error {
        self.harness.event(&Event {
            name: "mongodb.refused",
            level: Level::Warn,
            fields: &[("reason", Field::Str(reason))],
        });
        Error::Refused(message.into())
    }

    /// Run one command on database `db` and return the reply, or the
    /// server's error.
    pub async fn command(&mut self, db: &str, cmd: Doc) -> Result<Doc> {
        let name = command_name(&cmd);
        let out = self.run(db, cmd).await;
        let (ok, code) = match &out {
            Ok(_) => (true, 0),
            Err(Error::Server { code, .. }) => (false, *code),
            Err(_) => (false, -1),
        };
        self.harness.event(&Event {
            name: "mongodb.command",
            level: if ok { Level::Debug } else { Level::Warn },
            fields: &[
                ("command", Field::Str(name)),
                ("ok", Field::Bool(ok)),
                ("code", Field::Int(code)),
            ],
        });
        out
    }

    async fn run(&mut self, db: &str, mut cmd: Doc) -> Result<Doc> {
        cmd.push(("$db".into(), Bson::str(db)));
        let id = self.next_id;
        self.next_id = self.next_id.wrapping_add(1).max(1);
        let frame = wire::encode_request(id, &cmd)?;
        self.io.write_all(&frame).await?;
        let header: [u8; 16] = self
            .io
            .read_exact(16)
            .await?
            .try_into()
            .map_err(|_| Error::Protocol("short header".into()))?;
        // Until the login succeeds the server has not proved it knows the password, so a large
        // reply is refused from its header, before the body is read or allocated.
        let max = if self.authenticated {
            wire::MAX_MESSAGE
        } else {
            wire::MAX_PRE_AUTH_MESSAGE
        };
        let len = wire::message_length_within(&header, max)?;
        if wire::response_to(&header) != id {
            return Err(Error::Protocol("a reply to another request".into()));
        }
        let rest = self.io.read_exact(len - 16).await?;
        let reply = wire::decode_reply(&rest)?;
        match get(&reply, "ok").and_then(as_i64) {
            Some(1) => Ok(reply),
            _ => {
                let code = get(&reply, "code").and_then(as_i64).unwrap_or(0);
                Err(Error::Server {
                    code,
                    message: server_message(code).to_owned(),
                })
            }
        }
    }

    /// The handshake: ask the server who it is and which protocol it speaks.
    pub async fn hello(&mut self) -> Result<Hello> {
        let mut client: Doc = Vec::new();
        if let Some(app) = &self.app_name {
            client.push(("application".into(), Bson::doc([("name", Bson::str(app))])));
        }
        client.push((
            "driver".into(),
            Bson::doc([
                ("name", Bson::str("mzizi-mongodb")),
                ("version", Bson::str(env!("CARGO_PKG_VERSION"))),
            ]),
        ));
        let r = self
            .command(
                "admin",
                vec![
                    ("hello".into(), Bson::Int32(1)),
                    ("helloOk".into(), Bson::Bool(true)),
                    ("client".into(), Bson::Doc(client)),
                ],
            )
            .await?;
        let flag = |k: &str| matches!(get(&r, k), Some(Bson::Bool(true)));
        Ok(Hello {
            primary: flag("isWritablePrimary"),
            secondary: flag("secondary"),
            max_wire_version: get(&r, "maxWireVersion").and_then(as_i64).unwrap_or(0),
        })
    }

    fn payload(r: &Doc) -> Result<String> {
        match get(r, "payload") {
            Some(Bson::Binary(b)) => String::from_utf8(b.clone())
                .map_err(|_| Error::Auth("the server's payload is not text".into())),
            _ => Err(Error::Auth("the server sent no SCRAM payload".into())),
        }
    }

    /// SCRAM-SHA-256 against `uri.auth_source`. `nonce` must be random and
    /// printable (no commas); the caller supplies it so this stays pure.
    pub async fn authenticate(
        &mut self,
        uri: &Uri,
        nonce: &str,
        cache: &mut SaltCache,
    ) -> Result<()> {
        self.authenticated = false;
        self.login(uri, nonce, cache).await?;
        self.authenticated = true;
        Ok(())
    }

    async fn login(&mut self, uri: &Uri, nonce: &str, cache: &mut SaltCache) -> Result<()> {
        let (first, bare) = scram::client_first(&uri.user, nonce);
        let start = self
            .command(
                &uri.auth_source,
                vec![
                    ("saslStart".into(), Bson::Int32(1)),
                    ("mechanism".into(), Bson::str("SCRAM-SHA-256")),
                    ("payload".into(), Bson::Binary(first.into_bytes())),
                    ("autoAuthorize".into(), Bson::Int32(1)),
                    (
                        "options".into(),
                        Bson::doc([("skipEmptyExchange", Bson::Bool(true))]),
                    ),
                ],
            )
            .await
            .map_err(auth_error)?;
        let conversation = get(&start, "conversationId")
            .cloned()
            .ok_or_else(|| Error::Auth("no conversation id".into()))?;
        let server_first = Self::payload(&start)?;
        let sf = scram::parse_server_first(&server_first, nonce)?;
        let salted = cache.get_or_compute(&uri.user, &uri.password, &sf.salt, sf.iterations)?;
        let (final_msg, expected) = scram::client_final(&salted, &bare, &server_first, &sf.nonce);
        let mut reply = self
            .command(
                &uri.auth_source,
                vec![
                    ("saslContinue".into(), Bson::Int32(1)),
                    ("conversationId".into(), conversation.clone()),
                    ("payload".into(), Bson::Binary(final_msg.into_bytes())),
                ],
            )
            .await
            .map_err(auth_error)?;
        scram::verify_server_final(&Self::payload(&reply)?, &expected)?;
        // With skipEmptyExchange the server is done here; an older one wants
        // one empty acknowledgement.
        for _ in 0..2 {
            if matches!(get(&reply, "done"), Some(Bson::Bool(true))) {
                return Ok(());
            }
            reply = self
                .command(
                    &uri.auth_source,
                    vec![
                        ("saslContinue".into(), Bson::Int32(1)),
                        ("conversationId".into(), conversation.clone()),
                        ("payload".into(), Bson::Binary(Vec::new())),
                    ],
                )
                .await
                .map_err(auth_error)?;
        }
        if matches!(get(&reply, "done"), Some(Bson::Bool(true))) {
            Ok(())
        } else {
            Err(Error::Auth("the exchange did not finish".into()))
        }
    }

    /// `ping`, for a health check.
    pub async fn ping(&mut self, db: &str) -> Result<()> {
        self.command(db, vec![("ping".into(), Bson::Int32(1))])
            .await
            .map(|_| ())
    }

    fn read_pref() -> (String, Bson) {
        (
            "$readPreference".into(),
            Bson::doc([("mode", Bson::str("secondaryPreferred"))]),
        )
    }

    /// Documents matching `filter`, at most `opts.limit` (capped at
    /// [`MAX_FIND_DOCS`]).
    pub async fn find(&mut self, db: &str, coll: &str, opts: &FindOptions) -> Result<Vec<Value>> {
        if !name_ok(db) || !name_ok(coll) {
            return Err(self.refuse("bad_name", "bad database or collection name"));
        }
        if runs_server_js(&opts.filter) || opts.projection.as_ref().is_some_and(runs_server_js) {
            return Err(self.refuse("server_js", "server-side JavaScript is refused"));
        }
        let limit = if opts.limit == 0 {
            MAX_FIND_DOCS
        } else {
            opts.limit.min(MAX_FIND_DOCS)
        };
        let mut cmd: Doc = vec![
            ("find".into(), Bson::str(coll)),
            ("filter".into(), Bson::from_json(&opts.filter)?),
        ];
        if let Some(p) = &opts.projection {
            cmd.push(("projection".into(), Bson::from_json(p)?));
        }
        if !opts.sort.is_empty() {
            cmd.push((
                "sort".into(),
                Bson::Doc(
                    opts.sort
                        .iter()
                        .map(|(k, dir)| (k.clone(), Bson::Int32(*dir)))
                        .collect(),
                ),
            ));
        }
        if opts.skip > 0 {
            cmd.push(("skip".into(), Bson::Int64(opts.skip as i64)));
        }
        cmd.push(("limit".into(), Bson::Int64(limit as i64)));
        cmd.push(("batchSize".into(), Bson::Int32(limit as i32)));
        cmd.push(("singleBatch".into(), Bson::Bool(true)));
        cmd.push(("maxTimeMS".into(), Bson::Int32(MAX_TIME_MS)));
        cmd.push(Self::read_pref());
        let reply = self.command(db, cmd).await?;
        let mut rows = batch(&reply, "firstBatch")?;
        // The cap holds even against a server that ignores `limit`.
        rows.truncate(limit);
        Ok(rows)
    }

    /// The first document matching `filter`, if any.
    pub async fn find_one(&mut self, db: &str, coll: &str, filter: Value) -> Result<Option<Value>> {
        let opts = FindOptions {
            filter,
            limit: 1,
            ..FindOptions::default()
        };
        Ok(self.find(db, coll, &opts).await?.into_iter().next())
    }

    /// An aggregation pipeline's results (at most [`MAX_AGGREGATE_DOCS`]; more
    /// is an error, not a silent cut). `$out` and `$merge` are refused, and so is any
    /// `$lookup`, `$graphLookup` or `$unionWith` that reads a collection other than `coll`:
    /// use [`Connection::aggregate_joining`] to name the ones a pipeline may read.
    pub async fn aggregate(
        &mut self,
        db: &str,
        coll: &str,
        pipeline: &[Value],
    ) -> Result<Vec<Value>> {
        self.aggregate_joining(db, coll, pipeline, &[]).await
    }

    /// [`Connection::aggregate`], where `$lookup`, `$graphLookup` and `$unionWith` may also read
    /// the collections in `joins` (in `db`), at any depth. Any other collection, or another
    /// database, is refused before anything is sent.
    pub async fn aggregate_joining(
        &mut self,
        db: &str,
        coll: &str,
        pipeline: &[Value],
        joins: &[&str],
    ) -> Result<Vec<Value>> {
        if !name_ok(db) || !name_ok(coll) {
            return Err(self.refuse("bad_name", "bad database or collection name"));
        }
        if pipeline.iter().any(writes) {
            return Err(self.refuse("read_only", "this client is read-only"));
        }
        if !pipeline.iter().all(|s| reads_only(s, coll, joins)) {
            return Err(self.refuse(
                "cross_collection",
                "a stage reads a collection the caller did not allow",
            ));
        }
        if pipeline.iter().any(runs_server_js) {
            return Err(self.refuse("server_js", "server-side JavaScript is refused"));
        }
        let cmd: Doc = vec![
            ("aggregate".into(), Bson::str(coll)),
            (
                "pipeline".into(),
                Bson::Array(
                    pipeline
                        .iter()
                        .map(Bson::from_json)
                        .collect::<Result<Vec<_>>>()?,
                ),
            ),
            (
                "cursor".into(),
                Bson::doc([("batchSize", Bson::Int32(BATCH))]),
            ),
            ("maxTimeMS".into(), Bson::Int32(MAX_TIME_MS)),
            Self::read_pref(),
        ];
        let mut reply = self.command(db, cmd).await?;
        let mut out = batch(&reply, "firstBatch")?;
        loop {
            let id = cursor_id(&reply);
            // More than the cap is refused however it arrived, including in one batch from a
            // server that ignores `batchSize`; at the cap with the cursor still open, the next
            // batch could only take it over.
            if out.len() > MAX_AGGREGATE_DOCS || (id != 0 && out.len() >= MAX_AGGREGATE_DOCS) {
                if id != 0 {
                    // Release the server-side cursor, then refuse.
                    let _ = self
                        .command(
                            db,
                            vec![
                                ("killCursors".into(), Bson::str(coll)),
                                ("cursors".into(), Bson::Array(vec![Bson::Int64(id)])),
                            ],
                        )
                        .await;
                }
                return Err(self.refuse(
                    "too_many_documents",
                    "the aggregation returned too many documents",
                ));
            }
            if id == 0 {
                return Ok(out);
            }
            reply = self
                .command(
                    db,
                    vec![
                        ("getMore".into(), Bson::Int64(id)),
                        ("collection".into(), Bson::str(coll)),
                        ("batchSize".into(), Bson::Int32(BATCH)),
                        ("maxTimeMS".into(), Bson::Int32(MAX_TIME_MS)),
                    ],
                )
                .await?;
            out.extend(batch(&reply, "nextBatch")?);
        }
    }
}

/// The name a command goes by in an event: one of the fixed words below, never the caller's.
fn command_name(cmd: &Doc) -> &'static str {
    const KNOWN: &[&str] = &[
        "hello",
        "saslStart",
        "saslContinue",
        "find",
        "aggregate",
        "getMore",
        "killCursors",
        "ping",
    ];
    cmd.first()
        .and_then(|(k, _)| KNOWN.iter().find(|n| **n == k.as_str()).copied())
        .unwrap_or("other")
}

/// What `find` takes.
#[derive(Debug, Clone, Default)]
pub struct FindOptions {
    /// The query filter, as JSON.
    pub filter: Value,
    /// The fields to return, as JSON; `None` returns whole documents.
    pub projection: Option<Value>,
    /// `(field, 1 | -1)` in order.
    pub sort: Vec<(String, i32)>,
    /// Documents to skip.
    pub skip: usize,
    /// 0 means [`MAX_FIND_DOCS`].
    pub limit: usize,
}

fn cursor_id(reply: &Doc) -> i64 {
    match get(reply, "cursor") {
        Some(Bson::Doc(c)) => get(c, "id").and_then(as_i64).unwrap_or(0),
        _ => 0,
    }
}

fn batch(reply: &Doc, key: &str) -> Result<Vec<Value>> {
    match get(reply, "cursor") {
        Some(Bson::Doc(c)) => match get(c, key) {
            Some(Bson::Array(a)) => Ok(a.iter().map(Bson::to_json).collect()),
            _ => Err(Error::Protocol(format!("the cursor has no {key}"))),
        },
        _ => Err(Error::Protocol("the reply has no cursor".into())),
    }
}

/// A refused login is an authentication error, not a generic server one.
fn auth_error(e: Error) -> Error {
    match e {
        Error::Server { code, .. } if code == 18 || code == 13 => {
            Error::Auth("the user or password was refused".into())
        }
        other => other,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::bson;
    use futures::executor::block_on;
    use std::cell::RefCell;
    use std::rc::Rc;

    /// A scripted server: each request frame goes to `handler`, which returns
    /// the reply document; replies queue up for `read_exact`.
    struct Mock {
        out: Vec<u8>,
        queue: Vec<u8>,
        seen: Rc<RefCell<Vec<Doc>>>,
        handler: Box<dyn FnMut(&Doc) -> Doc>,
        /// Answer with this `responseTo` instead of the request id.
        wrong_response_to: bool,
        /// The size of every `read_exact` the client asked for.
        reads: Rc<RefCell<Vec<usize>>>,
    }

    impl Mock {
        fn new(handler: impl FnMut(&Doc) -> Doc + 'static) -> (Self, Rc<RefCell<Vec<Doc>>>) {
            let seen = Rc::new(RefCell::new(Vec::new()));
            (
                Mock {
                    out: Vec::new(),
                    queue: Vec::new(),
                    seen: seen.clone(),
                    handler: Box::new(handler),
                    wrong_response_to: false,
                    reads: Rc::new(RefCell::new(Vec::new())),
                },
                seen,
            )
        }
    }

    impl Io for Mock {
        async fn write_all(&mut self, buf: &[u8]) -> Result<()> {
            self.out.extend_from_slice(buf);
            let len = i32::from_le_bytes(self.out[0..4].try_into().unwrap()) as usize;
            assert_eq!(self.out.len(), len, "one whole request per write");
            let id = i32::from_le_bytes(self.out[4..8].try_into().unwrap());
            let doc = bson::decode(&self.out[21..]).unwrap();
            self.out.clear();
            self.seen.borrow_mut().push(doc.clone());
            let reply = (self.handler)(&doc);
            let to = if self.wrong_response_to { id + 1 } else { id };
            self.queue.extend(wire::encode_reply(to, &reply).unwrap());
            Ok(())
        }

        async fn read_exact(&mut self, n: usize) -> Result<Vec<u8>> {
            self.reads.borrow_mut().push(n);
            if self.queue.len() < n {
                return Err(Error::Io("closed".into()));
            }
            Ok(self.queue.drain(..n).collect())
        }
    }

    fn ok() -> Doc {
        vec![("ok".into(), Bson::Double(1.0))]
    }

    fn with(mut d: Doc, k: &str, v: Bson) -> Doc {
        d.push((k.into(), v));
        d
    }

    fn cursor(id: i64, key: &str, docs: Vec<Bson>) -> Doc {
        with(
            ok(),
            "cursor",
            Bson::doc([
                ("id", Bson::Int64(id)),
                ("ns", Bson::str("weather.x")),
                (key, Bson::Array(docs)),
            ]),
        )
    }

    fn name(d: &Doc) -> String {
        d[0].0.clone()
    }

    #[test]
    fn a_command_carries_its_name_first_and_the_database_last() {
        let (mock, seen) = Mock::new(|_| ok());
        let mut c = Connection::new(mock);
        block_on(c.ping("weather")).unwrap();
        let sent = seen.borrow();
        assert_eq!(name(&sent[0]), "ping");
        assert_eq!(
            sent[0].last().unwrap(),
            &("$db".to_owned(), Bson::str("weather"))
        );
    }

    #[test]
    fn hello_reads_the_member_role() {
        let (mock, _) = Mock::new(|_| {
            let mut d = ok();
            d.push(("isWritablePrimary".into(), Bson::Bool(false)));
            d.push(("secondary".into(), Bson::Bool(true)));
            d.push(("maxWireVersion".into(), Bson::Int32(21)));
            d
        });
        let mut c = Connection::new(mock);
        assert_eq!(
            block_on(c.hello()).unwrap(),
            Hello {
                primary: false,
                secondary: true,
                max_wire_version: 21
            }
        );
    }

    #[test]
    fn a_server_error_is_an_error_with_its_code() {
        let (mock, _) = Mock::new(|_| {
            vec![
                ("ok".into(), Bson::Double(0.0)),
                ("errmsg".into(), Bson::str("no such command")),
                ("code".into(), Bson::Int32(59)),
            ]
        });
        let mut c = Connection::new(mock);
        assert_eq!(
            block_on(c.ping("x")).unwrap_err(),
            Error::Server {
                code: 59,
                message: "command not found".into()
            }
        );
    }

    #[test]
    fn a_server_error_keeps_its_code_and_never_the_servers_text() {
        // A parse error that echoes the query, as MongoDB's do.
        let echoed = "unknown operator: $eq in {email: \"private@example.com\"} on shard-07";
        for code in [2, 9, 12345] {
            let (mock, _) = Mock::new(move |_| {
                vec![
                    ("ok".into(), Bson::Double(0.0)),
                    ("errmsg".into(), Bson::str(echoed)),
                    ("code".into(), Bson::Int32(code)),
                ]
            });
            let mut c = Connection::new(mock);
            let e = block_on(c.find("weather", "x", &FindOptions::default())).unwrap_err();
            let Error::Server { code: got, message } = &e else {
                panic!("not a server error");
            };
            assert_eq!(*got, i64::from(code));
            assert_eq!(message, server_message(i64::from(code)));
            for text in [format!("{e}"), format!("{e:?}")] {
                for part in ["private@example.com", "shard-07", "unknown operator"] {
                    assert!(
                        !text.contains(part),
                        "code {code}: the server's text leaked"
                    );
                }
            }
        }
    }

    #[test]
    fn hello_names_this_driver_and_the_app_and_nothing_else() {
        let (mock, seen) = Mock::new(|_| ok());
        let mut c = Connection::new(mock).with_app_name("weather-worker");
        block_on(c.hello()).unwrap();
        let (mock, seen_plain) = Mock::new(|_| ok());
        let mut plain = Connection::new(mock).with_app_name(&"x".repeat(MAX_APP_NAME + 10));
        block_on(plain.hello()).unwrap();
        let driver = Bson::doc([
            ("name", Bson::str("mzizi-mongodb")),
            ("version", Bson::str(env!("CARGO_PKG_VERSION"))),
        ]);
        assert_eq!(
            get(&seen.borrow()[0], "client"),
            Some(&Bson::Doc(vec![
                (
                    "application".into(),
                    Bson::doc([("name", Bson::str("weather-worker"))])
                ),
                ("driver".into(), driver.clone()),
            ]))
        );
        let sent = seen_plain.borrow();
        let Some(Bson::Doc(client)) = get(&sent[0], "client") else {
            panic!("no client document");
        };
        assert_eq!(
            get(client, "application"),
            Some(&Bson::doc([("name", Bson::str(&"x".repeat(MAX_APP_NAME)))]))
        );
        let (mock, seen_none) = Mock::new(|_| ok());
        block_on(Connection::new(mock).hello()).unwrap();
        assert_eq!(
            get(&seen_none.borrow()[0], "client"),
            Some(&Bson::Doc(vec![("driver".into(), driver)]))
        );
        let encoded = format!("{:?}", seen.borrow()[0]);
        assert!(!encoded.contains("mukoko"), "another app's name is sent");
    }

    /// A reply carrying a string of `n` bytes.
    fn big_reply(n: usize) -> Doc {
        with(ok(), "pad", Bson::str(&"a".repeat(n)))
    }

    #[test]
    fn a_large_reply_before_the_login_is_refused_without_being_read() {
        let (mock, _) = Mock::new(|_| big_reply(wire::MAX_PRE_AUTH_MESSAGE));
        let reads = mock.reads.clone();
        let mut c = Connection::new(mock);
        assert!(matches!(block_on(c.hello()), Err(Error::Protocol(_))));
        // Only the 16-byte header was read; the body was neither read nor allocated.
        assert_eq!(*reads.borrow(), vec![16]);
        // A reply just under the cap is fine.
        let (mock, _) = Mock::new(|_| big_reply(wire::MAX_PRE_AUTH_MESSAGE - 100));
        assert!(block_on(Connection::new(mock).hello()).is_ok());
    }

    #[test]
    fn after_the_login_a_large_reply_is_read() {
        let mut scram = scram_server("weather", testdata::get("good_password"), false);
        let (mock, _) = Mock::new(move |req| match name(req).as_str() {
            "ping" => big_reply(wire::MAX_PRE_AUTH_MESSAGE * 2),
            _ => scram(req),
        });
        let mut c = Connection::new(mock);
        assert!(matches!(block_on(c.ping("x")), Err(Error::Protocol(_))));
        let (mock, _) = Mock::new({
            let mut scram = scram_server("weather", testdata::get("good_password"), false);
            move |req| match name(req).as_str() {
                "ping" => big_reply(wire::MAX_PRE_AUTH_MESSAGE * 2),
                _ => scram(req),
            }
        });
        let mut c = Connection::new(mock);
        block_on(c.authenticate(
            &uri(&testdata::get("good_password")),
            &testdata::get("client_nonce"),
            &mut SaltCache::new(),
        ))
        .unwrap();
        assert!(block_on(c.ping("x")).is_ok());
    }

    #[test]
    fn a_reply_to_another_request_is_refused() {
        let (mut mock, _) = Mock::new(|_| ok());
        mock.wrong_response_to = true;
        let mut c = Connection::new(mock);
        assert!(matches!(block_on(c.ping("x")), Err(Error::Protocol(_))));
    }

    #[test]
    fn find_sends_a_bounded_read_only_query_and_returns_json() {
        let (mock, seen) = Mock::new(|_| {
            cursor(
                0,
                "firstBatch",
                vec![Bson::doc([
                    ("slug", Bson::str("harare")),
                    ("n", Bson::Int32(1)),
                ])],
            )
        });
        let mut c = Connection::new(mock);
        let rows = block_on(c.find(
            "places",
            "placesGeo",
            &FindOptions {
                filter: serde_json::json!({"isoCode": "ZW"}),
                projection: Some(serde_json::json!({"_id": 0})),
                sort: vec![("name".into(), 1), ("rank".into(), -1)],
                limit: 50_000,
                ..FindOptions::default()
            },
        ))
        .unwrap();
        assert_eq!(rows, vec![serde_json::json!({"slug": "harare", "n": 1})]);
        let sent = seen.borrow();
        let cmd = &sent[0];
        assert_eq!(name(cmd), "find");
        assert_eq!(get(cmd, "limit"), Some(&Bson::Int64(1_000)));
        assert_eq!(get(cmd, "singleBatch"), Some(&Bson::Bool(true)));
        assert_eq!(
            get(cmd, "$readPreference"),
            Some(&Bson::doc([("mode", Bson::str("secondaryPreferred"))]))
        );
        // The sort keeps its order.
        assert_eq!(
            get(cmd, "sort"),
            Some(&Bson::Doc(vec![
                ("name".into(), Bson::Int32(1)),
                ("rank".into(), Bson::Int32(-1))
            ]))
        );
        assert!(get(cmd, "maxTimeMS").is_some());
    }

    #[test]
    fn find_one_asks_for_one() {
        let (mock, seen) = Mock::new(|_| cursor(0, "firstBatch", vec![]));
        let mut c = Connection::new(mock);
        assert_eq!(
            block_on(c.find_one("places", "placesGeo", serde_json::json!({"a": 1}))).unwrap(),
            None
        );
        assert_eq!(get(&seen.borrow()[0], "limit"), Some(&Bson::Int64(1)));
    }

    #[test]
    fn bad_names_are_refused_before_anything_is_sent() {
        let (mock, seen) = Mock::new(|_| ok());
        let mut c = Connection::new(mock);
        for (db, coll) in [
            ("", "c"),
            ("d", ""),
            ("d$x", "c"),
            ("d", "c\0"),
            ("d", "a b"),
        ] {
            let r = block_on(c.find(db, coll, &FindOptions::default()));
            assert!(matches!(r, Err(Error::Refused(_))), "{db}/{coll}");
        }
        assert!(seen.borrow().is_empty());
    }

    /// Records every event as `name` plus the debug text of its fields.
    struct Recorder(RefCell<Vec<(String, String)>>);

    impl harness::Harness for Recorder {
        fn event(&self, e: &Event<'_>) {
            self.0
                .borrow_mut()
                .push((e.name.to_owned(), format!("{:?}", e.fields)));
        }
    }

    #[test]
    fn a_harness_sees_each_command_and_refusal_and_never_the_data() {
        let (mock, _) = Mock::new(|_| cursor(0, "firstBatch", vec![]));
        let rec = Rc::new(Recorder(RefCell::new(Vec::new())));
        let mut c = Connection::new(mock).with_harness(rec.clone());
        let opts = FindOptions {
            filter: serde_json::json!({"email": "secret@example.com"}),
            ..FindOptions::default()
        };
        block_on(c.find("weather", "personsPrivate", &opts)).unwrap();
        let _ = block_on(c.aggregate(
            "weather",
            "x",
            &[serde_json::json!({"$out": "personsPrivate"})],
        ));
        let events = rec.0.borrow();
        assert_eq!(events[0].0, "mongodb.command");
        assert!(events[0].1.contains("\"find\""), "{events:?}");
        assert_eq!(events[1].0, "mongodb.refused");
        assert!(events[1].1.contains("read_only"), "{events:?}");
        // The messages name the event and the value by index, never the value itself.
        for (e, (_, fields)) in events.iter().enumerate() {
            for (i, value) in ["secret@example.com", "personsPrivate", "weather"]
                .iter()
                .enumerate()
            {
                assert!(!fields.contains(value), "event {e} carried value {i}");
            }
        }
    }

    #[test]
    fn without_a_harness_nothing_is_reported_and_everything_works() {
        let (mock, _) = Mock::new(|_| cursor(0, "firstBatch", vec![]));
        let mut c = Connection::new(mock);
        assert!(block_on(c.find("weather", "x", &FindOptions::default())).is_ok());
    }

    #[test]
    fn aggregate_refuses_writes_and_follows_the_cursor() {
        let (mock, seen) = Mock::new(|req| match name(req).as_str() {
            "aggregate" => cursor(77, "firstBatch", vec![Bson::doc([("n", Bson::Int32(1))])]),
            "getMore" => cursor(0, "nextBatch", vec![Bson::doc([("n", Bson::Int32(2))])]),
            other => panic!("unexpected {other}"),
        });
        let mut c = Connection::new(mock);
        let r = block_on(c.aggregate(
            "weather",
            "observations",
            &[
                serde_json::json!({"$match": {"a": 1}}),
                serde_json::json!({"$out": "x"}),
            ],
        ));
        assert!(matches!(r, Err(Error::Refused(_))));
        assert!(seen.borrow().is_empty());
        let r = block_on(c.aggregate(
            "weather",
            "observations",
            &[serde_json::json!({"$match": {"a": 1}})],
        ))
        .unwrap();
        assert_eq!(
            r,
            vec![serde_json::json!({"n": 1}), serde_json::json!({"n": 2})]
        );
        let sent = seen.borrow();
        assert_eq!(name(&sent[1]), "getMore");
        assert_eq!(get(&sent[1], "getMore"), Some(&Bson::Int64(77)));
    }

    #[test]
    fn a_runaway_aggregation_is_cut_off_and_its_cursor_killed() {
        let (mock, seen) = Mock::new(|req| match name(req).as_str() {
            "killCursors" => ok(),
            _ => cursor(
                9,
                if name(req) == "aggregate" {
                    "firstBatch"
                } else {
                    "nextBatch"
                },
                (0..BATCH).map(Bson::Int32).collect(),
            ),
        });
        let mut c = Connection::new(mock);
        let r = block_on(c.aggregate("weather", "observations", &[]));
        assert!(matches!(r, Err(Error::Refused(_))));
        let sent = seen.borrow();
        assert_eq!(name(sent.last().unwrap()), "killCursors");
    }

    #[test]
    fn server_side_javascript_is_refused_before_anything_is_sent() {
        let (mock, seen) = Mock::new(|_| cursor(0, "firstBatch", vec![]));
        let mut c = Connection::new(mock);
        for filter in [
            serde_json::json!({"$where": "sleep(10000) || true"}),
            serde_json::json!({"a": 1, "$or": [{"$where": "true"}]}),
            serde_json::json!({"$expr": {"$function": {"body": "x", "args": [], "lang": "js"}}}),
        ] {
            let opts = FindOptions {
                filter,
                ..FindOptions::default()
            };
            let r = block_on(c.find("weather", "x", &opts));
            assert!(matches!(r, Err(Error::Refused(_))), "{r:?}");
        }
        let opts = FindOptions {
            projection: Some(serde_json::json!({"v": {"$function": {"body": "x"}}})),
            ..FindOptions::default()
        };
        assert!(matches!(
            block_on(c.find("weather", "x", &opts)),
            Err(Error::Refused(_))
        ));
        for stage in [
            serde_json::json!({"$match": {"$where": "true"}}),
            serde_json::json!({"$group": {"_id": 1, "v": {"$accumulator": {"init": "x"}}}}),
        ] {
            let r = block_on(c.aggregate("weather", "x", &[stage]));
            assert!(matches!(r, Err(Error::Refused(_))), "{r:?}");
        }
        assert!(seen.borrow().is_empty());
        // A field merely named like an operator's value is fine.
        let opts = FindOptions {
            filter: serde_json::json!({"note": "$where"}),
            ..FindOptions::default()
        };
        assert!(block_on(c.find("weather", "x", &opts)).is_ok());
    }

    #[test]
    fn a_stage_that_reads_another_collection_is_refused_unless_the_caller_allows_it() {
        use serde_json::json;
        let (mock, seen) = Mock::new(|_| cursor(0, "firstBatch", vec![]));
        let rec = Rc::new(Recorder(RefCell::new(Vec::new())));
        let mut c = Connection::new(mock).with_harness(rec.clone());
        let reaching = [
            json!({"$lookup": {"from": "persons", "localField": "a", "foreignField": "b", "as": "p"}}),
            json!({"$graphLookup": {"from": "persons", "startWith": "$a", "connectFromField": "a",
                "connectToField": "b", "as": "p"}}),
            json!({"$unionWith": "persons"}),
            json!({"$unionWith": {"coll": "persons", "pipeline": []}}),
            // Another database is never allowed, even by name.
            json!({"$lookup": {"from": {"db": "admin", "coll": "system.users"}, "as": "p"}}),
            // Nested: inside a lookup's own pipeline, a $facet and a $unionWith pipeline.
            json!({"$lookup": {"from": "observations", "as": "p",
                "pipeline": [{"$lookup": {"from": "persons", "as": "q", "pipeline": []}}]}}),
            json!({"$facet": {"a": [{"$unionWith": "persons"}]}}),
            json!({"$unionWith": {"coll": "observations",
                "pipeline": [{"$graphLookup": {"from": "persons", "as": "p"}}]}}),
            json!({"$lookup": "persons"}),
        ];
        for (i, stage) in reaching.iter().enumerate() {
            let r = block_on(c.aggregate("weather", "observations", std::slice::from_ref(stage)));
            assert!(matches!(r, Err(Error::Refused(_))), "stage {i} was sent");
        }
        assert!(seen.borrow().is_empty());
        assert!(
            rec.0
                .borrow()
                .iter()
                .all(|(n, f)| n == "mongodb.refused" && f.contains("cross_collection"))
        );
        // Allowed: the aggregation's own collection, a `$documents` pipeline, and a collection
        // the caller names (at any depth).
        for stage in [
            json!({"$lookup": {"from": "observations", "as": "p", "localField": "a",
                "foreignField": "b"}}),
            json!({"$lookup": {"as": "p", "pipeline": [{"$documents": [{"a": 1}]}]}}),
            json!({"$unionWith": {"pipeline": [{"$documents": [{"a": 1}]}]}}),
        ] {
            assert!(block_on(c.aggregate("weather", "observations", &[stage])).is_ok());
        }
        for stage in &reaching[..4] {
            let r = block_on(c.aggregate_joining(
                "weather",
                "observations",
                &[json!({"$facet": {"a": [stage.clone()]}})],
                &["persons"],
            ));
            assert!(r.is_ok(), "{r:?}");
        }
        // Naming one collection does not open another, nor another database.
        for (i, stage) in [json!({"$unionWith": "sessions"}), reaching[4].clone()]
            .iter()
            .enumerate()
        {
            let r = block_on(c.aggregate_joining(
                "weather",
                "observations",
                std::slice::from_ref(stage),
                &["persons"],
            ));
            assert!(matches!(r, Err(Error::Refused(_))), "stage {i} was sent");
        }
    }

    #[test]
    fn a_nested_write_stage_is_refused() {
        let (mock, seen) = Mock::new(|_| cursor(0, "firstBatch", vec![]));
        let mut c = Connection::new(mock);
        let r = block_on(c.aggregate(
            "weather",
            "observations",
            &[serde_json::json!({"$facet": {"a": [{"$merge": "x"}]}})],
        ));
        assert!(matches!(r, Err(Error::Refused(_))));
        assert!(seen.borrow().is_empty());
    }

    #[test]
    fn find_never_returns_more_than_its_limit_even_from_a_server_that_ignores_it() {
        let (mock, _) = Mock::new(|_| cursor(0, "firstBatch", (0..10).map(Bson::Int32).collect()));
        let mut c = Connection::new(mock);
        let opts = FindOptions {
            limit: 3,
            ..FindOptions::default()
        };
        assert_eq!(block_on(c.find("weather", "x", &opts)).unwrap().len(), 3);
    }

    #[test]
    fn an_aggregation_over_the_cap_in_one_batch_is_refused() {
        let over = i32::try_from(MAX_AGGREGATE_DOCS).unwrap() + 1;
        let (mock, _) =
            Mock::new(move |_| cursor(0, "firstBatch", (0..over).map(Bson::Int32).collect()));
        let mut c = Connection::new(mock);
        let r = block_on(c.aggregate("weather", "observations", &[]));
        assert!(matches!(r, Err(Error::Refused(_))), "{r:?}");
        // Exactly the cap, with the cursor closed, is fine.
        let at = i32::try_from(MAX_AGGREGATE_DOCS).unwrap();
        let (mock, _) =
            Mock::new(move |_| cursor(0, "firstBatch", (0..at).map(Bson::Int32).collect()));
        let mut c = Connection::new(mock);
        assert_eq!(
            block_on(c.aggregate("weather", "observations", &[]))
                .unwrap()
                .len(),
            MAX_AGGREGATE_DOCS
        );
    }

    // ---- authentication against a server that runs SCRAM itself ----------

    use crate::testdata;

    fn salt() -> Vec<u8> {
        testdata::get("server_salt").into_bytes()
    }

    /// The server side of SCRAM-SHA-256 for `user` / `password`.
    fn scram_server(
        user: &'static str,
        password: String,
        break_signature: bool,
    ) -> impl FnMut(&Doc) -> Doc {
        let salt = salt();
        let nonce_tail = testdata::get("server_nonce_tail");
        let mut client_first_bare = String::new();
        let mut server_first = String::new();
        let mut combined = String::new();
        move |req: &Doc| {
            let payload = |d: &Doc| match get(d, "payload") {
                Some(Bson::Binary(b)) => String::from_utf8(b.clone()).unwrap(),
                _ => panic!("no payload"),
            };
            match name(req).as_str() {
                "saslStart" => {
                    let first = payload(req);
                    client_first_bare = first.strip_prefix("n,,").unwrap().to_owned();
                    let nonce = client_first_bare
                        .split(',')
                        .find_map(|p| p.strip_prefix("r="))
                        .unwrap();
                    combined = format!("{nonce}{nonce_tail}");
                    server_first = format!("r={combined},s={},i=4096", {
                        use base64::Engine;
                        base64::engine::general_purpose::STANDARD.encode(&salt)
                    });
                    let mut d = ok();
                    d.push(("conversationId".into(), Bson::Int32(1)));
                    d.push((
                        "payload".into(),
                        Bson::Binary(server_first.clone().into_bytes()),
                    ));
                    d.push(("done".into(), Bson::Bool(false)));
                    d
                }
                "saslContinue" => {
                    let salted = scram::salted_password(&password, &salt, 4096).unwrap();
                    let (expected_final, mut sig) =
                        scram::client_final(&salted, &client_first_bare, &server_first, &combined);
                    if payload(req) != expected_final {
                        return vec![
                            ("ok".into(), Bson::Double(0.0)),
                            ("code".into(), Bson::Int32(18)),
                            ("errmsg".into(), Bson::str("Authentication failed.")),
                        ];
                    }
                    if break_signature {
                        sig[0] ^= 0xff;
                    }
                    use base64::Engine;
                    let v = format!(
                        "v={}",
                        base64::engine::general_purpose::STANDARD.encode(sig)
                    );
                    let mut d = ok();
                    d.push(("conversationId".into(), Bson::Int32(1)));
                    d.push(("payload".into(), Bson::Binary(v.into_bytes())));
                    d.push(("done".into(), Bson::Bool(true)));
                    let _ = user;
                    d
                }
                other => panic!("unexpected {other}"),
            }
        }
    }

    fn uri(password: &str) -> Uri {
        crate::uri::parse(&format!("mongodb://weather:{password}@h1:27017/weather")).unwrap()
    }

    #[test]
    fn the_scram_handshake_completes_against_a_real_exchange() {
        let (mock, seen) = Mock::new(scram_server(
            "weather",
            testdata::get("good_password"),
            false,
        ));
        let mut c = Connection::new(mock);
        block_on(c.authenticate(
            &uri(&testdata::get("good_password")),
            &testdata::get("client_nonce"),
            &mut SaltCache::new(),
        ))
        .unwrap();
        let sent = seen.borrow();
        assert_eq!(name(&sent[0]), "saslStart");
        assert_eq!(
            get(&sent[0], "mechanism"),
            Some(&Bson::str("SCRAM-SHA-256"))
        );
        // Authenticates against `authSource`, not the data database.
        assert_eq!(sent[0].last().unwrap().1, Bson::str("admin"));
        assert_eq!(name(&sent[1]), "saslContinue");
        assert_eq!(sent.len(), 2, "skipEmptyExchange: no third round trip");
    }

    #[test]
    fn a_wrong_password_is_an_authentication_error() {
        let (mock, _) = Mock::new(scram_server(
            "weather",
            testdata::get("good_password"),
            false,
        ));
        let mut c = Connection::new(mock);
        let r = block_on(c.authenticate(
            &uri(&testdata::get("bad_password")),
            &testdata::get("client_nonce"),
            &mut SaltCache::new(),
        ));
        assert!(
            matches!(r, Err(Error::Auth(_))),
            "authentication was not refused"
        );
    }

    #[test]
    fn a_server_that_cannot_prove_the_password_is_refused() {
        let (mock, _) = Mock::new(scram_server(
            "weather",
            testdata::get("good_password"),
            true,
        ));
        let mut c = Connection::new(mock);
        let r = block_on(c.authenticate(
            &uri(&testdata::get("good_password")),
            &testdata::get("client_nonce"),
            &mut SaltCache::new(),
        ));
        assert!(
            matches!(r, Err(Error::Auth(_))),
            "authentication was not refused"
        );
    }

    /// Compiles only for a type that wipes its memory when dropped.
    fn wiped_on_drop<T: zeroize::ZeroizeOnDrop>(_: &T) {}

    #[test]
    fn the_salt_cache_wipes_the_password_and_the_key_it_holds() {
        let mut cache = SaltCache::new();
        let salt = testdata::get("short_salt").into_bytes();
        let returned = cache
            .get_or_compute("u", &testdata::get("cache_password"), &salt, 4096)
            .unwrap();
        wiped_on_drop(&returned);
        let (password, key) = cache.0.values().next().unwrap();
        wiped_on_drop(password);
        wiped_on_drop(key);
    }

    #[test]
    fn the_salted_password_is_computed_once_per_isolate() {
        let (pw, other, salt) = (
            testdata::get("cache_password"),
            testdata::get("other_password"),
            testdata::get("short_salt").into_bytes(),
        );
        let mut cache = SaltCache::new();
        let a = cache.get_or_compute("u", &pw, &salt, 4096).unwrap();
        assert_eq!(cache.0.len(), 1);
        assert_eq!(a, cache.get_or_compute("u", &pw, &salt, 4096).unwrap());
        assert_eq!(cache.0.len(), 1);
        // Another password under the same key recomputes: a different result,
        // and the entry now holds the new password.
        let b = cache.get_or_compute("u", &other, &salt, 4096).unwrap();
        assert_ne!(a, b);
        assert_eq!(cache.0.len(), 1);
        assert_eq!(b, scram::salted_password(&other, &salt, 4096).unwrap());
        assert_eq!(b, cache.get_or_compute("u", &other, &salt, 4096).unwrap());
    }
}
