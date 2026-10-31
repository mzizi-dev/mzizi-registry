//! Holds the crate to its contracts in `contracts/lib/`: every contract's fixtures
//! exist, and every invariant names a test that exists in this crate (a `fn` with
//! that name in `src/` or `tests/`). A contract that promises a behaviour no test
//! checks fails here. Like the other crates' contract suites it is a registry gate
//! and does not ship (`exclude = ["tests/"]`).

use std::fs;
use std::path::PathBuf;

use serde_json::Value;

fn root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..")
}

fn crate_sources() -> String {
    let base = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let mut text = String::new();
    for dir in ["src", "tests"] {
        for entry in fs::read_dir(base.join(dir)).unwrap() {
            let path = entry.unwrap().path();
            if path.extension().is_some_and(|e| e == "rs") {
                text.push_str(&fs::read_to_string(path).unwrap());
            }
        }
    }
    text
}

#[test]
fn every_lib_contract_is_held_by_real_tests_and_fixtures() {
    let sources = crate_sources();
    let dir = root().join("contracts/lib");
    let mut seen = 0;
    for entry in fs::read_dir(&dir).unwrap() {
        let path = entry.unwrap().path();
        if !path.to_string_lossy().ends_with(".contract.json") {
            continue;
        }
        seen += 1;
        let c: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
        let name = c["name"].as_str().unwrap();
        assert_eq!(c["node"], 5, "{name}: this crate is N5");
        assert_eq!(
            c["implementations"]["rs"]["crate"], "mzizi-resilience",
            "{name}: names the crate"
        );
        for f in c["fixtures"].as_array().unwrap() {
            let file = root()
                .join("__tests__/fixtures/resilience")
                .join(f.as_str().unwrap());
            assert!(file.exists(), "{name}: fixture {f} is missing");
        }
        let invariants = c["invariants"].as_array().unwrap();
        assert!(!invariants.is_empty(), "{name}: no invariants");
        for inv in invariants {
            let test = inv["test"].as_str().unwrap();
            assert!(
                sources.contains(&format!("fn {test}(")),
                "{name}: invariant {} names test `{test}`, which does not exist",
                inv["id"]
            );
        }
    }
    assert_eq!(
        seen, 6,
        "breaker, retry, bulkhead, rate limiter, chain, deadline"
    );
}
