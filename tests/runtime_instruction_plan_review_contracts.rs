use std::fs;
use std::path::{Path, PathBuf};

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).to_path_buf()
}

fn assert_file_contains(path: PathBuf, needle: &str) {
    let source = fs::read_to_string(&path)
        .unwrap_or_else(|error| panic!("{} should be readable: {error}", path.display()));
    assert!(
        source.contains(needle),
        "{} should contain {:?}",
        path.display(),
        needle
    );
}

#[test]
fn skill_docs_route_plan_review_through_independent_fidelity_gate() {
    let root = repo_root();

    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "plan-ceo-review -> writing-plans -> plan-fidelity review -> plan-eng-review -> execution.",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "Plan exists, is `Draft`, and is missing, stale, malformed, non-pass, or non-independent plan-fidelity receipt evidence: invoke `featureforge:writing-plans`.",
    );
    assert_file_contains(
        root.join("skills/using-featureforge/SKILL.md"),
        "Plan exists, is `Draft`, and has a matching pass dedicated plan-fidelity receipt: invoke `featureforge:plan-eng-review`.",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "dispatch or resume a dedicated independent plan-fidelity reviewer before `plan-eng-review` becomes reachable.",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "\"$_FEATUREFORGE_BIN\" workflow plan-fidelity record --plan",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "--review-artifact",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Requirement Index",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "execution-topology claims",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Distinct From Stages",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Verified Requirement IDs",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Reviewed Plan Fingerprint",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Reviewed Spec Fingerprint",
    );
    assert_file_contains(
        root.join("skills/writing-plans/SKILL.md"),
        "Review Verdict: pass",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "Before starting engineering review, require a matching runtime-owned plan-fidelity receipt in pass state for the current plan revision and approved spec revision.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "If the spec is not workflow-valid `CEO Approved` with `**Last Reviewed By:** plan-ceo-review`, stop and direct the agent back to `featureforge:plan-ceo-review`.",
    );
    assert_file_contains(
        root.join("skills/plan-eng-review/SKILL.md"),
        "plan_fidelity_receipt.state",
    );
}
