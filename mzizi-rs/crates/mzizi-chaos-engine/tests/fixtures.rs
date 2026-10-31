//! Runs `__tests__/fixtures/chaos/seeded.json`: the fault sequence per seed, produced
//! by an independent (Python) implementation of the same rule. If this passes, Rust
//! and Python agree to the last fault; the TypeScript build is held to the same file.

use std::path::PathBuf;

use mzizi_chaos_engine::{Engine, Fault, Plan};
use serde_json::Value;

fn num(v: &Value, k: &str) -> f64 {
    v[k].as_f64().unwrap_or_else(|| panic!("missing {k}"))
}

#[test]
fn seeded_sequences_match_the_vectors() {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../../__tests__/fixtures/chaos/seeded.json");
    let f: Value = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
    let cases = f["cases"].as_array().unwrap();
    assert!(cases.len() >= 4);
    for case in cases {
        let p = &case["plan"];
        let plan = Plan {
            seed: p["seed"].as_u64().unwrap(),
            unreachable_rate: num(p, "unreachable_rate"),
            timeout_rate: num(p, "timeout_rate"),
            error_rate: num(p, "error_rate"),
            latency_rate: num(p, "latency_rate"),
            latency_min_ms: p["latency_min_ms"].as_u64().unwrap(),
            latency_max_ms: p["latency_max_ms"].as_u64().unwrap(),
            error_statuses: p["error_statuses"]
                .as_array()
                .unwrap()
                .iter()
                .map(|s| s.as_u64().unwrap() as u16)
                .collect(),
        };
        let want = case["faults"].as_array().unwrap();
        let got = Engine::new(plan, "test").unwrap().schedule(want.len());
        for (i, (g, w)) in got.iter().zip(want).enumerate() {
            let expected = match w["fault"].as_str().unwrap() {
                "none" => Fault::None,
                "unreachable" => Fault::Unreachable,
                "timeout" => Fault::Timeout,
                "error" => Fault::Error {
                    status: w["status"].as_u64().unwrap() as u16,
                },
                "latency" => Fault::Latency {
                    ms: w["ms"].as_u64().unwrap(),
                },
                other => panic!("unknown fault {other}"),
            };
            assert_eq!(*g, expected, "{} #{i}", case["name"]);
        }
    }
}
