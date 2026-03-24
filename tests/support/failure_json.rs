use serde_json::Value;
use std::process::Output;

pub fn parse_failure_json(output: &Output, context: &str) -> Value {
    assert!(
        !output.status.success(),
        "{context} should fail, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    serde_json::from_slice(&output.stderr)
        .unwrap_or_else(|error| panic!("{context} should emit valid failure json: {error}"))
}
