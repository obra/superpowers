use std::fs;
use std::path::Path;

use schemars::{JsonSchema, schema_for};
use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::contracts::plan::{AnalyzePlanReport, PlanDocument, PlanTask};
use crate::contracts::spec::{Requirement, SpecDocument};
use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::runtime_root::write_runtime_root_schema;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct TaskPacket {
    pub plan_path: String,
    pub plan_revision: u32,
    pub plan_fingerprint: String,
    pub source_spec_path: String,
    pub source_spec_revision: u32,
    pub source_spec_fingerprint: String,
    pub task_number: u32,
    pub task_title: String,
    pub open_questions: String,
    pub requirement_ids: Vec<String>,
    pub generated_at: String,
    pub packet_fingerprint: String,
    pub markdown: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct HarnessContractProvenance {
    pub source_plan_path: String,
    pub source_plan_revision: u32,
    pub source_plan_fingerprint: String,
    pub source_spec_path: String,
    pub source_spec_revision: u32,
    pub source_spec_fingerprint: String,
    pub source_task_packet_fingerprints: Vec<String>,
}

pub fn build_harness_contract_provenance(
    task_packets: &[TaskPacket],
) -> Result<HarnessContractProvenance, DiagnosticError> {
    let Some(first) = task_packets.first() else {
        return Err(DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            String::from(
                "Harness contract task packet provenance requires at least one task packet.",
            ),
        ));
    };

    let expected_plan_path = first.plan_path.clone();
    let expected_plan_revision = first.plan_revision;
    let expected_plan_fingerprint = first.plan_fingerprint.clone();
    let expected_spec_path = first.source_spec_path.clone();
    let expected_spec_revision = first.source_spec_revision;
    let expected_spec_fingerprint = first.source_spec_fingerprint.clone();

    for (index, packet) in task_packets.iter().enumerate().skip(1) {
        let matches_baseline = packet.plan_path == expected_plan_path
            && packet.plan_revision == expected_plan_revision
            && packet.plan_fingerprint == expected_plan_fingerprint
            && packet.source_spec_path == expected_spec_path
            && packet.source_spec_revision == expected_spec_revision
            && packet.source_spec_fingerprint == expected_spec_fingerprint;
        if !matches_baseline {
            return Err(DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!(
                    "Harness contract task packet provenance mismatch at index {index}; all packets must share source plan/spec provenance."
                ),
            ));
        }
    }

    Ok(HarnessContractProvenance {
        source_plan_path: expected_plan_path,
        source_plan_revision: expected_plan_revision,
        source_plan_fingerprint: expected_plan_fingerprint,
        source_spec_path: expected_spec_path,
        source_spec_revision: expected_spec_revision,
        source_spec_fingerprint: expected_spec_fingerprint,
        source_task_packet_fingerprints: task_packets
            .iter()
            .map(|packet| packet.packet_fingerprint.clone())
            .collect(),
    })
}

pub fn build_task_packet_with_timestamp(
    spec: &SpecDocument,
    plan: &PlanDocument,
    task_number: u32,
    generated_at: &str,
) -> Result<TaskPacket, DiagnosticError> {
    let task = plan
        .tasks
        .iter()
        .find(|task| task.number == task_number)
        .ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Task {task_number} was not found."),
            )
        })?;

    let covered_requirements = requirement_subset(spec, &task.spec_coverage);
    let plan_fingerprint = sha256_hex(plan.source.as_bytes());
    let source_spec_fingerprint = sha256_hex(spec.source.as_bytes());
    let markdown = render_packet_markdown(
        plan,
        task,
        &covered_requirements,
        generated_at,
        &plan_fingerprint,
        &source_spec_fingerprint,
    );
    let packet_fingerprint = sha256_hex(markdown.as_bytes());

    Ok(TaskPacket {
        plan_path: plan.path.clone(),
        plan_revision: plan.plan_revision,
        plan_fingerprint,
        source_spec_path: spec.path.clone(),
        source_spec_revision: spec.spec_revision,
        source_spec_fingerprint,
        task_number: task.number,
        task_title: task.title.clone(),
        open_questions: task.open_questions.clone(),
        requirement_ids: task.spec_coverage.clone(),
        generated_at: generated_at.to_owned(),
        packet_fingerprint,
        markdown,
    })
}

pub fn write_contract_schemas(output_dir: impl AsRef<Path>) -> Result<(), DiagnosticError> {
    let output_dir = output_dir.as_ref();
    fs::create_dir_all(output_dir).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!(
                "Could not create schema directory {}: {err}",
                output_dir.display()
            ),
        )
    })?;

    let analyze_schema = schema_for!(AnalyzePlanReport);
    let packet_schema = schema_for!(TaskPacket);
    fs::write(
        output_dir.join("plan-contract-analyze.schema.json"),
        serde_json::to_string_pretty(&analyze_schema).expect("analyze schema should serialize"),
    )
    .map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not write analyze schema: {err}"),
        )
    })?;
    fs::write(
        output_dir.join("plan-contract-packet.schema.json"),
        serde_json::to_string_pretty(&packet_schema).expect("packet schema should serialize"),
    )
    .map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not write packet schema: {err}"),
        )
    })?;
    write_runtime_root_schema(output_dir)?;
    Ok(())
}

fn render_packet_markdown(
    plan: &PlanDocument,
    task: &PlanTask,
    requirements: &[Requirement],
    generated_at: &str,
    plan_fingerprint: &str,
    source_spec_fingerprint: &str,
) -> String {
    let mut markdown = String::new();
    markdown.push_str("## Task Packet\n\n");
    markdown.push_str(&format!("**Plan Path:** `{}`\n", plan.path));
    markdown.push_str(&format!("**Plan Revision:** {}\n", plan.plan_revision));
    markdown.push_str(&format!("**Plan Fingerprint:** `{plan_fingerprint}`\n"));
    markdown.push_str(&format!(
        "**Source Spec Path:** `{}`\n",
        plan.source_spec_path
    ));
    markdown.push_str(&format!(
        "**Source Spec Revision:** {}\n",
        plan.source_spec_revision
    ));
    markdown.push_str(&format!(
        "**Source Spec Fingerprint:** `{source_spec_fingerprint}`\n"
    ));
    markdown.push_str(&format!("**Task Number:** {}\n", task.number));
    markdown.push_str(&format!("**Task Title:** {}\n", task.title));
    markdown.push_str(&format!("**Open Questions:** {}\n", task.open_questions));
    markdown.push_str(&format!("**Generated At:** {generated_at}\n\n"));
    markdown.push_str("## Covered Requirements\n\n");
    for requirement in requirements {
        markdown.push_str(&format!(
            "- [{}][{}] {}\n",
            requirement.id, requirement.kind, requirement.text
        ));
    }
    markdown.push_str("\n## Task Block\n\n");
    markdown.push_str(&format!("## Task {}: {}\n\n", task.number, task.title));
    markdown.push_str(&format!(
        "**Spec Coverage:** {}\n",
        task.spec_coverage.join(", ")
    ));
    markdown.push_str(&format!("**Task Outcome:** {}\n", task.task_outcome));
    markdown.push_str("**Plan Constraints:**\n");
    for constraint in &task.plan_constraints {
        markdown.push_str(&format!("- {constraint}\n"));
    }
    markdown.push_str(&format!("**Open Questions:** {}\n\n", task.open_questions));
    markdown.push_str("**Files:**\n");
    for file in &task.files {
        markdown.push_str(&format!("- {}: `{}`\n", file.action, file.path));
    }
    markdown.push('\n');
    for step in &task.steps {
        markdown.push_str(&format!("- [ ] **Step {}: {}**\n", step.number, step.text));
    }
    markdown
}

fn requirement_subset(spec: &SpecDocument, ids: &[String]) -> Vec<Requirement> {
    spec.requirements
        .iter()
        .filter(|requirement| ids.contains(&requirement.id))
        .cloned()
        .collect()
}

fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}
