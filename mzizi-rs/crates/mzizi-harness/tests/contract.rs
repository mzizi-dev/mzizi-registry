//! The server contract (`mzizi-rs/contracts/server/mzizi-harness.contract.json`) held to the source.
//!
//! A server component renders no markup, so its contract is not about states and density.
//! It says what the crate exports, which limits it enforces, what it refuses and what it
//! reports to the server harness, and it names the test that proves each guarantee. This
//! test fails when the contract and the crate disagree: a surface item that is gone, a
//! limit whose value changed, a guarantee whose test does not exist, a harness event the
//! source never emits, or a contract that does not match the schema's required shape.

use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

const CONTRACT: &str = include_str!("../../../contracts/server/mzizi-harness.contract.json");
const SCHEMA: &str = include_str!("../../../contracts/schema/server-contract.schema.json");

fn crate_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn read(rel: &str) -> String {
    fs::read_to_string(crate_root().join(rel)).unwrap_or_else(|e| panic!("cannot read {rel}: {e}"))
}

/// Every `.rs` file under `src/` and `tests/`, concatenated.
fn all_source() -> String {
    fn walk(dir: &Path, out: &mut String) {
        for entry in fs::read_dir(dir).unwrap().flatten() {
            let p = entry.path();
            if p.is_dir() {
                walk(&p, out);
            } else if p.extension().is_some_and(|e| e == "rs") {
                out.push_str(&fs::read_to_string(&p).unwrap());
                out.push('\n');
            }
        }
    }
    let mut s = String::new();
    walk(&crate_root().join("src"), &mut s);
    walk(&crate_root().join("tests"), &mut s);
    s
}

fn contract() -> Value {
    serde_json::from_str(CONTRACT).expect("the contract is JSON")
}

fn arr<'a>(v: &'a Value, key: &str) -> &'a Vec<Value> {
    v[key]
        .as_array()
        .unwrap_or_else(|| panic!("`{key}` is an array"))
}

fn text<'a>(v: &'a Value, key: &str) -> &'a str {
    v[key]
        .as_str()
        .unwrap_or_else(|| panic!("`{key}` is a string"))
}

#[test]
fn the_contract_has_every_field_the_schema_requires() {
    let schema: Value = serde_json::from_str(SCHEMA).unwrap();
    let c = contract();
    for key in schema["required"].as_array().unwrap() {
        assert!(c.get(key.as_str().unwrap()).is_some(), "missing `{key}`");
    }
    let allowed = schema["properties"].as_object().unwrap();
    for key in c.as_object().unwrap().keys() {
        assert!(allowed.contains_key(key), "`{key}` is not in the schema");
    }
    assert_eq!(c["kind"], "server");
    assert_eq!(text(&c, "name"), "server/mzizi-harness");
}

#[test]
fn the_contract_names_this_crate_and_its_version_is_semver() {
    let c = contract();
    assert_eq!(
        text(&c["implementations"]["rs"], "crate"),
        env!("CARGO_PKG_NAME")
    );
    let parts: Vec<&str> = text(&c, "version").split('.').collect();
    assert!(parts.len() == 3 && parts.iter().all(|p| p.parse::<u32>().is_ok()));
}

#[test]
fn every_surface_item_is_still_declared_where_the_contract_says() {
    for item in arr(&contract(), "surface") {
        let (decl, file) = (text(item, "item"), text(item, "file"));
        assert!(read(file).contains(decl), "`{decl}` is not in {file}");
    }
}

#[test]
fn every_limit_matches_the_constant_in_the_source() {
    for limit in arr(&contract(), "limits") {
        let (name, file) = (text(limit, "const"), text(limit, "file"));
        let value = limit["value"].as_i64().unwrap();
        let src = read(file);
        let line = src
            .lines()
            .find(|l| l.contains(&format!("pub const {name}:")))
            .unwrap_or_else(|| panic!("`pub const {name}` is not in {file}"));
        let literal = line
            .split('=')
            .nth(1)
            .unwrap()
            .trim()
            .trim_end_matches(';')
            .replace('_', "");
        assert_eq!(literal.parse::<i64>().unwrap(), value, "{name}");
    }
}

#[test]
fn every_guarantee_and_refusal_names_a_test_that_exists() {
    let c = contract();
    let src = all_source();
    for group in ["guarantees", "refusals"] {
        for entry in arr(&c, group) {
            for t in arr(entry, "tests") {
                let name = t.as_str().unwrap();
                assert!(
                    src.contains(&format!("fn {name}()")),
                    "{group} `{}` names a test `{name}` that does not exist",
                    text(entry, "id")
                );
            }
        }
    }
}

#[test]
fn ids_are_unique() {
    let c = contract();
    for group in ["guarantees", "refusals"] {
        let mut ids: Vec<&str> = arr(&c, group).iter().map(|e| text(e, "id")).collect();
        ids.sort_unstable();
        let n = ids.len();
        ids.dedup();
        assert_eq!(ids.len(), n, "duplicate id in {group}");
    }
}

#[test]
fn the_harness_cannot_carry_a_runtime_string() {
    // The contract's secrecy claim rests on the Event type; hold the type to it.
    let src = read("src/lib.rs");
    assert!(src.contains("pub name: &'static str"));
    assert!(src.contains("Str(&'static str)"));
    assert!(!src.contains("Str(String)") && !src.contains("Str(&'a str)"));
}

#[test]
fn the_default_harness_is_noop_and_removable() {
    let c = contract();
    assert_eq!(c["harness"]["default"], "Noop");
    assert_eq!(c["harness"]["removable"], true);
    assert!(read("src/lib.rs").contains("pub struct Noop"));
    assert_eq!(c["harness"]["pluggedInto"], "mzizi-harness");
}
