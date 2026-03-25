#![allow(dead_code)]

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

use serde::Serialize;
use tempfile::TempDir;

pub const EXECUTION_PLAN_REL: &str = "docs/featureforge/plans/2026-03-17-example-execution-plan.md";
pub const EXECUTION_SPEC_REL: &str =
    "docs/featureforge/specs/2026-03-17-example-execution-plan-design.md";
pub const PLAN_CONTRACT_PLAN_REL: &str =
    "docs/featureforge/plans/2026-03-22-plan-contract-fixture.md";
pub const PLAN_CONTRACT_SPEC_REL: &str =
    "docs/featureforge/specs/2026-03-22-plan-contract-fixture-design.md";

pub struct BenchConfig {
    pub benchmark: &'static str,
    pub iterations: u32,
    pub warmup_iterations: u32,
    pub output_path: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BenchReport {
    pub benchmark: String,
    pub iterations: u32,
    pub warmup_iterations: u32,
    pub total_ms: f64,
    pub mean_ms: f64,
    pub min_ms: f64,
    pub max_ms: f64,
}

pub fn parse_args(benchmark: &'static str) -> BenchConfig {
    let mut iterations = 50_u32;
    let mut warmup_iterations = 5_u32;
    let mut output_path = None;

    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--iterations" => {
                let value = args
                    .next()
                    .unwrap_or_else(|| panic!("--iterations requires a numeric value"));
                iterations = value
                    .parse::<u32>()
                    .unwrap_or_else(|_| panic!("invalid --iterations value: {value}"));
            }
            "--warmup" => {
                let value = args
                    .next()
                    .unwrap_or_else(|| panic!("--warmup requires a numeric value"));
                warmup_iterations = value
                    .parse::<u32>()
                    .unwrap_or_else(|_| panic!("invalid --warmup value: {value}"));
            }
            "--output" => {
                let value = args
                    .next()
                    .unwrap_or_else(|| panic!("--output requires a file path"));
                output_path = Some(PathBuf::from(value));
            }
            _ => {}
        }
    }

    BenchConfig {
        benchmark,
        iterations,
        warmup_iterations,
        output_path,
    }
}

pub fn run_benchmark<F>(config: &BenchConfig, mut op: F) -> BenchReport
where
    F: FnMut(),
{
    for _ in 0..config.warmup_iterations {
        op();
    }

    let mut samples = Vec::with_capacity(config.iterations as usize);
    for _ in 0..config.iterations {
        let start = Instant::now();
        op();
        samples.push(start.elapsed().as_secs_f64() * 1_000.0);
    }

    let total_ms = samples.iter().sum::<f64>();
    let mean_ms = total_ms / samples.len() as f64;
    let min_ms = samples.iter().copied().fold(f64::INFINITY, f64::min);
    let max_ms = samples.iter().copied().fold(f64::NEG_INFINITY, f64::max);

    BenchReport {
        benchmark: config.benchmark.to_owned(),
        iterations: config.iterations,
        warmup_iterations: config.warmup_iterations,
        total_ms,
        mean_ms,
        min_ms,
        max_ms,
    }
}

pub fn emit_report(config: &BenchConfig, report: &BenchReport) {
    let payload = serde_json::to_string_pretty(report)
        .expect("benchmark report serialization should stay valid json");
    if let Some(path) = &config.output_path {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("benchmark output parent should exist");
        }
        fs::write(path, format!("{payload}\n")).expect("benchmark report should be writable");
    }
    println!("{payload}");
}

pub fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

pub fn create_workflow_fixture_repo() -> (TempDir, TempDir) {
    let (repo_dir, state_dir) = init_git_repo(
        "workflow-status-bench",
        "git@github.com:example/workflow-status-bench.git",
    );
    let repo = repo_dir.path();
    let fixture_root = repo_root().join("tests/codex-runtime/fixtures/workflow-artifacts");

    copy_fixture(
        &fixture_root.join("specs/2026-03-22-runtime-integration-hardening-design.md"),
        &repo.join("docs/featureforge/specs/2026-03-22-runtime-integration-hardening-design.md"),
    );
    copy_fixture(
        &fixture_root.join("plans/2026-03-22-runtime-integration-hardening.md"),
        &repo.join("docs/featureforge/plans/2026-03-22-runtime-integration-hardening.md"),
    );

    (repo_dir, state_dir)
}

pub fn create_execution_fixture_repo() -> (TempDir, TempDir) {
    let (repo_dir, state_dir) = init_git_repo(
        "execution-status-bench",
        "git@github.com:example/execution-status-bench.git",
    );
    let repo = repo_dir.path();

    write_file(
        &repo.join(EXECUTION_SPEC_REL),
        r#"# Example Execution Plan Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for execution-status benchmark coverage.
"#,
    );

    write_file(
        &repo.join(EXECUTION_PLAN_REL),
        &format!(
            r#"# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `{EXECUTION_SPEC_REL}`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Benchmark status

**Spec Coverage:** REQ-001, REQ-002, VERIFY-001
**Task Outcome:** Execution status can parse the approved plan and stay execution-clean.
**Plan Constraints:**
- Keep the fixture compact and deterministic.
- Preserve canonical task and file-block structure.
**Open Questions:** none

**Files:**
- Modify: `docs/example-output.md`
- Test: `tests/codex-runtime/test-featureforge-plan-execution.sh`

- [ ] **Step 1: Prepare the benchmark fixture**
- [ ] **Step 2: Read execution status**
"#,
        ),
    );

    (repo_dir, state_dir)
}

pub fn create_plan_contract_fixture_repo() -> TempDir {
    let repo_dir = TempDir::new().expect("plan-contract tempdir should exist");
    let repo = repo_dir.path();
    let fixture_root = repo_root().join("tests/codex-runtime/fixtures/plan-contract");

    copy_fixture(
        &fixture_root.join("valid-spec.md"),
        &repo.join(PLAN_CONTRACT_SPEC_REL),
    );
    copy_fixture(
        &fixture_root.join("valid-plan.md"),
        &repo.join(PLAN_CONTRACT_PLAN_REL),
    );

    repo_dir
}

fn init_git_repo(name: &str, remote_url: &str) -> (TempDir, TempDir) {
    let repo_dir = TempDir::new().expect("repo tempdir should exist");
    let state_dir = TempDir::new().expect("state tempdir should exist");
    let repo = repo_dir.path();

    run_checked(
        Command::new("git").arg("init").current_dir(repo),
        "git init",
    );
    run_checked(
        Command::new("git")
            .args(["config", "user.name", "FeatureForge Test"])
            .current_dir(repo),
        "git config user.name",
    );
    run_checked(
        Command::new("git")
            .args(["config", "user.email", "featureforge-tests@example.com"])
            .current_dir(repo),
        "git config user.email",
    );

    write_file(&repo.join("README.md"), &format!("# {name}\n"));
    run_checked(
        Command::new("git")
            .args(["add", "README.md"])
            .current_dir(repo),
        "git add README",
    );
    run_checked(
        Command::new("git")
            .args(["commit", "-m", "init"])
            .current_dir(repo),
        "git commit init",
    );
    run_checked(
        Command::new("git")
            .args(["checkout", "-B", "bench-runtime"])
            .current_dir(repo),
        "git checkout bench branch",
    );
    run_checked(
        Command::new("git")
            .args(["remote", "add", "origin", remote_url])
            .current_dir(repo),
        "git remote add origin",
    );

    (repo_dir, state_dir)
}

fn run_checked(command: &mut Command, context: &str) {
    let output = command
        .output()
        .unwrap_or_else(|error| panic!("{context} should run: {error}"));
    assert!(
        output.status.success(),
        "{context} should succeed, got {:?}\nstdout:\n{}\nstderr:\n{}",
        output.status,
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
}

fn copy_fixture(source: &Path, destination: &Path) {
    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).expect("fixture parent directories should exist");
    }
    fs::copy(source, destination).expect("fixture should copy");
}

fn write_file(path: &Path, contents: &str) {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).expect("fixture parent directory should exist");
    }
    fs::write(path, contents).expect("fixture file should be writable");
}
