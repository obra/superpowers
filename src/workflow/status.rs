use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use schemars::JsonSchema;
use schemars::schema_for;
use serde::Serialize;

use crate::cli::workflow::ArtifactKind;
use crate::contracts::plan::AnalyzePlanReport;
use crate::contracts::runtime::analyze_contract_report;
use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::git::{RepositoryIdentity, discover_repo_identity};
use crate::paths::{RepoPath, superpowers_state_dir};
use crate::session_entry;
use crate::workflow::manifest::{
    ManifestLoadResult, WorkflowManifest, load_manifest, load_manifest_read_only, manifest_path,
    recover_slug_changed_manifest, recover_slug_changed_manifest_read_only, save_manifest,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct WorkflowRoute {
    pub schema_version: u32,
    pub status: String,
    pub next_skill: String,
    pub spec_path: String,
    pub plan_path: String,
    pub contract_state: String,
    pub reason_codes: Vec<String>,
    pub diagnostics: Vec<WorkflowDiagnostic>,
    pub scan_truncated: bool,
    pub spec_candidate_count: usize,
    pub plan_candidate_count: usize,
    pub manifest_path: String,
    pub root: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub reason: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    pub note: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct WorkflowDiagnostic {
    pub code: String,
    pub severity: String,
    pub artifact: String,
    pub message: String,
    pub remediation: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct WorkflowPhase {
    pub phase: String,
    pub route_status: String,
    pub next_skill: String,
    pub next_action: String,
    pub spec_path: String,
    pub plan_path: String,
    pub session_entry: SessionEntryState,
    pub route: WorkflowRoute,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct SessionEntryState {
    pub outcome: String,
    pub decision_source: String,
    pub session_key: String,
    pub decision_path: String,
    pub policy_source: String,
    pub persisted: bool,
    pub failure_class: String,
    pub reason: String,
}

#[derive(Debug, Clone)]
pub struct WorkflowRuntime {
    pub identity: RepositoryIdentity,
    pub state_dir: PathBuf,
    pub manifest_path: PathBuf,
    pub manifest: Option<WorkflowManifest>,
    pub manifest_warning: Option<String>,
    pub manifest_recovery_reasons: Vec<String>,
}

#[derive(Debug, Clone)]
struct WorkflowSpecCandidate {
    path: String,
    workflow_state: String,
    spec_revision: u32,
    malformed_headers: bool,
}

#[derive(Debug, Clone)]
struct WorkflowPlanCandidate {
    path: String,
    workflow_state: String,
    source_spec_path: String,
    source_spec_revision: Option<u32>,
}

impl WorkflowRuntime {
    pub fn discover(current_dir: &Path) -> Result<Self, DiagnosticError> {
        Self::discover_with_loader(current_dir, false)
    }

    pub fn discover_read_only(current_dir: &Path) -> Result<Self, DiagnosticError> {
        Self::discover_with_loader(current_dir, true)
    }

    fn discover_with_loader(current_dir: &Path, read_only: bool) -> Result<Self, DiagnosticError> {
        let identity = discover_repo_identity(current_dir)?;
        let state_dir = superpowers_state_dir();
        let manifest_path = manifest_path(&identity, &state_dir);
        let load = if read_only {
            load_manifest_read_only
        } else {
            load_manifest
        };
        let (manifest, manifest_warning, manifest_recovery_reasons) = match load(&manifest_path) {
            ManifestLoadResult::Missing => {
                let recovered_manifest = if read_only {
                    recover_slug_changed_manifest_read_only(&identity, &state_dir, &manifest_path)
                } else {
                    recover_slug_changed_manifest(&identity, &state_dir, &manifest_path)
                };
                if let Some(manifest) = recovered_manifest {
                    (
                        Some(manifest),
                        None,
                        vec![String::from("repo_slug_recovered")],
                    )
                } else {
                    (None, None, Vec::new())
                }
            }
            ManifestLoadResult::Loaded(manifest) => {
                let mut reasons = Vec::new();
                if manifest.repo_root != identity.repo_root.to_string_lossy() {
                    reasons.push(String::from("repo_root_mismatch"));
                }
                if manifest.branch != identity.branch_name {
                    reasons.push(String::from("branch_mismatch"));
                }
                (Some(manifest), None, reasons)
            }
            ManifestLoadResult::Corrupt { backup_path } => {
                if read_only {
                    (None, None, vec![String::from("corrupt_manifest_present")])
                } else {
                    (
                        None,
                        Some(format!(
                            "warning: corrupt manifest rescued to {}",
                            backup_path.display()
                        )),
                        Vec::new(),
                    )
                }
            }
        };
        Ok(Self {
            identity,
            state_dir,
            manifest_path,
            manifest,
            manifest_warning,
            manifest_recovery_reasons,
        })
    }

    pub fn status(&self) -> Result<WorkflowRoute, DiagnosticError> {
        resolve_route(self, false, false)
            .map(|route| self.decorate_route_with_manifest_context(route))
    }

    pub fn status_refresh(&mut self) -> Result<WorkflowRoute, DiagnosticError> {
        let route = self.decorate_route_with_manifest_context(resolve_route(self, false, true)?);

        let manifest = WorkflowManifest {
            version: 1,
            repo_root: self.identity.repo_root.to_string_lossy().into_owned(),
            branch: self.identity.branch_name.clone(),
            expected_spec_path: route.spec_path.clone(),
            expected_plan_path: route.plan_path.clone(),
            status: route.status.clone(),
            next_skill: route.next_skill.clone(),
            reason: route.reason.clone(),
            note: route.note.clone(),
            updated_at: String::from("1970-01-01T00:00:00Z"),
        };
        if let Err(route) = self.persist_manifest_with_retry(
            manifest.clone(),
            route.spec_path.clone(),
            route.plan_path.clone(),
        ) {
            return Ok(route);
        }
        self.manifest = Some(manifest);
        self.manifest_warning = None;
        self.manifest_recovery_reasons.clear();
        Ok(route)
    }

    pub fn resolve(&self) -> Result<WorkflowRoute, DiagnosticError> {
        match env::var("SUPERPOWERS_WORKFLOW_RESOLVE_TEST_FAILPOINT").as_deref() {
            Ok("invalid_contract") => {
                return Err(DiagnosticError::new(
                    FailureClass::ResolverContractViolation,
                    "Resolver contract violation injected by test failpoint.",
                ));
            }
            Ok("runtime_failure") => {
                return Err(DiagnosticError::new(
                    FailureClass::ResolverRuntimeFailure,
                    "Resolver runtime failure injected by test failpoint.",
                ));
            }
            _ => {}
        }
        resolve_route(self, true, false)
            .map(|route| self.decorate_route_with_manifest_context(route))
    }

    pub fn expect(
        &mut self,
        artifact: ArtifactKind,
        raw_path: &Path,
    ) -> Result<WorkflowRoute, DiagnosticError> {
        let repo_path = normalize_repo_path(raw_path)?;
        let mut manifest = self.manifest.clone().unwrap_or_else(|| WorkflowManifest {
            version: 1,
            repo_root: self.identity.repo_root.to_string_lossy().into_owned(),
            branch: self.identity.branch_name.clone(),
            expected_spec_path: String::new(),
            expected_plan_path: String::new(),
            status: String::from("needs_brainstorming"),
            next_skill: String::from("superpowers:brainstorming"),
            reason: String::new(),
            note: String::new(),
            updated_at: String::from("1970-01-01T00:00:00Z"),
        });
        match artifact {
            ArtifactKind::Spec => {
                manifest.expected_spec_path = repo_path.clone();
                manifest.expected_plan_path.clear();
                manifest.status = String::from("needs_brainstorming");
                manifest.next_skill = String::from("superpowers:brainstorming");
                manifest.reason = String::from("missing_expected_spec,expect_set");
                manifest.note = manifest.reason.clone();
            }
            ArtifactKind::Plan => {
                manifest.expected_plan_path = repo_path.clone();
                manifest.status = String::from("plan_draft");
                manifest.next_skill = String::from("superpowers:plan-eng-review");
                manifest.reason = String::from("missing_expected_plan,expect_set");
                manifest.note = manifest.reason.clone();
            }
        }
        if let Err(route) = self.persist_manifest_with_retry(
            manifest.clone(),
            manifest.expected_spec_path.clone(),
            manifest.expected_plan_path.clone(),
        ) {
            return Ok(route);
        }
        self.manifest = Some(manifest);
        self.status()
    }

    pub fn sync(
        &mut self,
        artifact: ArtifactKind,
        path: Option<&Path>,
    ) -> Result<WorkflowRoute, DiagnosticError> {
        let repo_path = if let Some(path) = path {
            normalize_repo_path(path)?
        } else {
            self.matching_manifest()
                .as_ref()
                .and_then(|manifest| match artifact {
                    ArtifactKind::Spec if !manifest.expected_spec_path.is_empty() => {
                        Some(manifest.expected_spec_path.clone())
                    }
                    ArtifactKind::Plan if !manifest.expected_plan_path.is_empty() => {
                        Some(manifest.expected_plan_path.clone())
                    }
                    _ => None,
                })
                .unwrap_or_default()
        };

        if repo_path.is_empty() {
            return self.status();
        }

        let mut manifest = self.manifest.clone().unwrap_or_else(|| WorkflowManifest {
            version: 1,
            repo_root: self.identity.repo_root.to_string_lossy().into_owned(),
            branch: self.identity.branch_name.clone(),
            expected_spec_path: String::new(),
            expected_plan_path: String::new(),
            status: String::new(),
            next_skill: String::new(),
            reason: String::new(),
            note: String::new(),
            updated_at: String::from("1970-01-01T00:00:00Z"),
        });
        match artifact {
            ArtifactKind::Spec => manifest.expected_spec_path = repo_path.clone(),
            ArtifactKind::Plan => manifest.expected_plan_path = repo_path.clone(),
        }
        if let Err(route) = self.persist_manifest_with_retry(
            manifest.clone(),
            manifest.expected_spec_path.clone(),
            manifest.expected_plan_path.clone(),
        ) {
            return Ok(route);
        }
        self.manifest = Some(manifest);

        let mut route = self.status()?;
        if !self.identity.repo_root.join(&repo_path).is_file() {
            route.spec_path = if matches!(artifact, ArtifactKind::Spec) {
                repo_path.clone()
            } else {
                route.spec_path
            };
            route.plan_path = if matches!(artifact, ArtifactKind::Plan) {
                repo_path.clone()
            } else {
                route.plan_path
            };
            route.reason_codes = match artifact {
                ArtifactKind::Spec => vec![
                    String::from("missing_expected_spec"),
                    String::from("sync_spec"),
                    String::from("missing_artifact"),
                ],
                ArtifactKind::Plan => vec![
                    String::from("missing_expected_plan"),
                    String::from("sync_plan"),
                    String::from("missing_artifact"),
                ],
            };
            route.reason = route.reason_codes.join(",");
            route.note = route.reason.clone();
        }

        Ok(route)
    }

    pub fn phase(&self) -> Result<WorkflowPhase, DiagnosticError> {
        let route = self.resolve()?;
        let session_entry = read_session_entry(&self.state_dir);
        let phase = if route.status == "implementation_ready" {
            String::from("execution_preflight")
        } else if route.status == "stale_plan" {
            String::from("plan_writing")
        } else {
            route.status.clone()
        };
        let next_action = if route.status == "implementation_ready" {
            String::from("execution_preflight")
        } else {
            String::from("use_next_skill")
        };

        Ok(WorkflowPhase {
            phase,
            route_status: route.status.clone(),
            next_skill: route.next_skill.clone(),
            next_action,
            spec_path: route.spec_path.clone(),
            plan_path: route.plan_path.clone(),
            session_entry,
            route,
        })
    }
}

impl WorkflowRuntime {
    fn matching_manifest(&self) -> Option<&WorkflowManifest> {
        self.manifest.as_ref().filter(|manifest| {
            manifest.repo_root == self.identity.repo_root.to_string_lossy()
                && manifest.branch == self.identity.branch_name
        })
    }

    fn decorate_route_with_manifest_context(&self, mut route: WorkflowRoute) -> WorkflowRoute {
        if let Some(warning) = &self.manifest_warning {
            if !route
                .reason_codes
                .iter()
                .any(|existing| existing == "corrupt_manifest_rescued")
            {
                route
                    .reason_codes
                    .push(String::from("corrupt_manifest_rescued"));
            }
            route.note = warning.clone();
            route.reason = warning.clone();
        }
        for reason_code in &self.manifest_recovery_reasons {
            if !route
                .reason_codes
                .iter()
                .any(|existing| existing == reason_code)
            {
                route.reason_codes.push(reason_code.clone());
            }
        }
        if !self.manifest_recovery_reasons.is_empty() {
            let recovery_reason = self.manifest_recovery_reasons.join(",");
            if route.reason.is_empty() {
                route.reason = recovery_reason.clone();
                route.note = recovery_reason;
            } else if !route.reason.contains(&recovery_reason) {
                route.reason = format!("{recovery_reason},{}", route.reason);
                route.note = route.reason.clone();
            }
        }
        route
    }

    fn persist_manifest_with_retry(
        &mut self,
        manifest: WorkflowManifest,
        spec_path: String,
        plan_path: String,
    ) -> Result<(), WorkflowRoute> {
        if save_manifest(&self.manifest_path, &manifest).is_ok() {
            return Ok(());
        }
        if save_manifest(&self.manifest_path, &manifest).is_ok() {
            return Ok(());
        }
        Err(self.manifest_write_conflict_route(spec_path, plan_path))
    }

    fn manifest_write_conflict_route(&self, spec_path: String, plan_path: String) -> WorkflowRoute {
        WorkflowRoute {
            schema_version: 2,
            status: String::from("needs_brainstorming"),
            next_skill: String::from("superpowers:brainstorming"),
            spec_path,
            plan_path,
            contract_state: String::from("unknown"),
            reason_codes: vec![String::from("manifest_write_conflict")],
            diagnostics: vec![WorkflowDiagnostic {
                code: String::from("manifest_write_conflict"),
                severity: String::from("error"),
                artifact: self.manifest_path.display().to_string(),
                message: String::from(
                    "Could not persist the workflow manifest after one retry attempt.",
                ),
                remediation: String::from(
                    "Restore write access to the workflow manifest directory and retry.",
                ),
            }],
            scan_truncated: false,
            spec_candidate_count: 0,
            plan_candidate_count: 0,
            manifest_path: self.manifest_path.display().to_string(),
            root: self.identity.repo_root.to_string_lossy().into_owned(),
            reason: String::from("manifest_write_conflict"),
            note: String::from("warning: manifest_write_conflict (retrying once)"),
        }
    }
}

fn resolve_route(
    runtime: &WorkflowRuntime,
    read_only: bool,
    refresh: bool,
) -> Result<WorkflowRoute, DiagnosticError> {
    let (mut spec_candidates, mut malformed_spec_candidates) =
        scan_specs(&runtime.identity.repo_root);
    spec_candidates.sort_by(|left, right| left.path.cmp(&right.path));
    malformed_spec_candidates.sort_by(|left, right| left.path.cmp(&right.path));
    let spec_candidate_count = spec_candidates.len();
    let (spec_candidates, scan_truncated) = apply_fallback_limit(spec_candidates);

    let plan_candidates = scan_plans(&runtime.identity.repo_root);
    let manifest_path = runtime.manifest_path.display().to_string();
    let root = runtime.identity.repo_root.to_string_lossy().into_owned();

    if let Some(manifest) = runtime.matching_manifest() {
        if !manifest.expected_spec_path.is_empty()
            && !runtime
                .identity
                .repo_root
                .join(&manifest.expected_spec_path)
                .is_file()
            && !(refresh && spec_candidates.len() == 1)
        {
            return Ok(WorkflowRoute {
                schema_version: 2,
                status: String::from("needs_brainstorming"),
                next_skill: String::from("superpowers:brainstorming"),
                spec_path: manifest.expected_spec_path.clone(),
                plan_path: String::new(),
                contract_state: String::from("unknown"),
                reason_codes: vec![String::from("missing_expected_spec")],
                diagnostics: Vec::new(),
                scan_truncated,
                spec_candidate_count: 0,
                plan_candidate_count: 0,
                manifest_path,
                root,
                reason: String::from("missing_expected_spec"),
                note: String::from("missing_expected_spec"),
            });
        }
    }

    if spec_candidates.is_empty() && !malformed_spec_candidates.is_empty() {
        let selected_spec = malformed_spec_candidates
            .last()
            .expect("non-empty malformed spec list should have a last entry");
        return Ok(WorkflowRoute {
            schema_version: 2,
            status: String::from("spec_draft"),
            next_skill: String::from("superpowers:plan-ceo-review"),
            spec_path: selected_spec.path.clone(),
            plan_path: String::new(),
            contract_state: String::from("unknown"),
            reason_codes: vec![String::from("malformed_spec_headers")],
            diagnostics: vec![WorkflowDiagnostic {
                code: String::from("malformed_spec_headers"),
                severity: String::from("error"),
                artifact: selected_spec.path.clone(),
                message: String::from(
                    "Spec headers are missing required Workflow State, Spec Revision, or Last Reviewed By fields.",
                ),
                remediation: String::from(
                    "Repair the spec headers before treating the document as an approved workflow artifact.",
                ),
            }],
            scan_truncated,
            spec_candidate_count: malformed_spec_candidates.len(),
            plan_candidate_count: plan_candidates.len(),
            manifest_path,
            root,
            reason: String::from("malformed_spec_headers"),
            note: String::from("malformed_spec_headers"),
        });
    }

    if spec_candidates.is_empty() {
        return Ok(WorkflowRoute {
            schema_version: 2,
            status: String::from("needs_brainstorming"),
            next_skill: String::from("superpowers:brainstorming"),
            spec_path: String::new(),
            plan_path: String::new(),
            contract_state: String::from("unknown"),
            reason_codes: Vec::new(),
            diagnostics: Vec::new(),
            scan_truncated,
            spec_candidate_count: 0,
            plan_candidate_count: plan_candidates.len(),
            manifest_path,
            root,
            reason: String::new(),
            note: String::new(),
        });
    }

    let manifest_selected_spec = runtime.matching_manifest().and_then(|manifest| {
        if manifest.expected_spec_path.is_empty() {
            return None;
        }
        let path = runtime
            .identity
            .repo_root
            .join(&manifest.expected_spec_path);
        if !path.is_file() {
            return None;
        }
        parse_workflow_spec_candidate(&path).ok()
    });
    let manifest_selected_spec_present = manifest_selected_spec.is_some();
    let selected_spec = manifest_selected_spec.unwrap_or_else(|| {
        spec_candidates
            .last()
            .cloned()
            .expect("non-empty candidate list should have a last entry")
    });

    if !manifest_selected_spec_present && spec_candidates.len() > 1 {
        return Ok(WorkflowRoute {
            schema_version: 2,
            status: String::from("spec_draft"),
            next_skill: String::from("superpowers:plan-ceo-review"),
            spec_path: selected_spec.path.clone(),
            plan_path: String::new(),
            contract_state: String::from("unknown"),
            reason_codes: vec![String::from("ambiguous_spec_candidates")],
            diagnostics: vec![WorkflowDiagnostic {
                code: String::from("ambiguous_spec_candidates"),
                severity: String::from("error"),
                artifact: selected_spec.path.clone(),
                message: String::from(
                    "More than one current spec candidate matches the fallback scan window.",
                ),
                remediation: String::from("Reduce spec ambiguity before proceeding."),
            }],
            scan_truncated,
            spec_candidate_count,
            plan_candidate_count: plan_candidates.len(),
            manifest_path,
            root,
            reason: String::from("fallback_ambiguity_spec"),
            note: String::from("fallback_ambiguity_spec"),
        });
    }

    if selected_spec.workflow_state == "Draft" {
        return Ok(WorkflowRoute {
            schema_version: 2,
            status: String::from("spec_draft"),
            next_skill: String::from("superpowers:plan-ceo-review"),
            spec_path: selected_spec.path.clone(),
            plan_path: String::new(),
            contract_state: String::from("unknown"),
            reason_codes: Vec::new(),
            diagnostics: Vec::new(),
            scan_truncated,
            spec_candidate_count,
            plan_candidate_count: plan_candidates.len(),
            manifest_path,
            root,
            reason: String::new(),
            note: String::new(),
        });
    }

    let approved_spec = selected_spec;
    let manifest_selected_plan = runtime
        .matching_manifest()
        .and_then(|manifest| {
            if manifest.expected_plan_path.is_empty() {
                return None;
            }
            let path = runtime
                .identity
                .repo_root
                .join(&manifest.expected_plan_path);
            if !path.is_file() {
                return None;
            }
            parse_workflow_plan_candidate(&path).ok()
        })
        .filter(|plan| {
            plan.path
                == runtime
                    .matching_manifest()
                    .map_or("", |manifest| manifest.expected_plan_path.as_str())
        });
    let exact_matching_plans = plan_candidates
        .iter()
        .filter(|plan| plan.source_spec_path == approved_spec.path)
        .collect::<Vec<_>>();
    let ambiguous_plan_candidate_count = if manifest_selected_plan.is_some() {
        0
    } else if exact_matching_plans.len() > 1 {
        exact_matching_plans.len()
    } else if exact_matching_plans.is_empty() && plan_candidates.len() > 1 {
        plan_candidates.len()
    } else {
        0
    };
    if ambiguous_plan_candidate_count > 1 {
        return Ok(WorkflowRoute {
            schema_version: 2,
            status: String::from("spec_approved_needs_plan"),
            next_skill: String::from("superpowers:writing-plans"),
            spec_path: approved_spec.path.clone(),
            plan_path: String::new(),
            contract_state: String::from("unknown"),
            reason_codes: vec![String::from("ambiguous_plan_candidates")],
            diagnostics: vec![WorkflowDiagnostic {
                code: String::from("ambiguous_plan_candidates"),
                severity: String::from("error"),
                artifact: approved_spec.path.clone(),
                message: String::from(
                    "More than one plan candidate matches the current approved spec.",
                ),
                remediation: String::from(
                    "Reduce plan ambiguity before treating the approved spec as ready for execution.",
                ),
            }],
            scan_truncated,
            spec_candidate_count,
            plan_candidate_count: ambiguous_plan_candidate_count,
            manifest_path,
            root,
            reason: String::from("ambiguous_plan_candidates"),
            note: String::from("ambiguous_plan_candidates"),
        });
    }
    let matching_plan = manifest_selected_plan
        .or_else(|| exact_matching_plans.first().copied().cloned())
        .or_else(|| {
            if plan_candidates.len() == 1 {
                plan_candidates.first().cloned()
            } else {
                None
            }
        });
    let preserved_plan_path = runtime
        .matching_manifest()
        .as_ref()
        .map(|manifest| manifest.expected_plan_path.clone())
        .filter(|path| !path.is_empty());
    let missing_expected_plan = preserved_plan_path
        .as_ref()
        .is_some_and(|path| !runtime.identity.repo_root.join(path).is_file());

    if let Some(plan) = matching_plan {
        let stale_source_spec_linkage = plan.source_spec_path != approved_spec.path
            || plan
                .source_spec_revision
                .is_some_and(|revision| revision != approved_spec.spec_revision);
        let report =
            analyze_full_contract(runtime.identity.repo_root.as_path(), &approved_spec, &plan);
        let packet_buildability_failure = report
            .as_ref()
            .is_some_and(needs_packet_buildability_failure);
        let contract_state = workflow_contract_state(
            report.as_ref(),
            stale_source_spec_linkage,
            packet_buildability_failure,
        );
        let reason_codes = workflow_reason_codes(
            report.as_ref(),
            stale_source_spec_linkage,
            packet_buildability_failure,
        );
        let diagnostics = workflow_diagnostics(
            &plan,
            &approved_spec,
            report.as_ref(),
            stale_source_spec_linkage,
            packet_buildability_failure,
        );
        let reason = compatibility_reason(&reason_codes);

        if plan.workflow_state == "Draft" {
            return Ok(WorkflowRoute {
                schema_version: 2,
                status: String::from("plan_draft"),
                next_skill: String::from("superpowers:plan-eng-review"),
                spec_path: approved_spec.path.clone(),
                plan_path: plan.path.clone(),
                contract_state,
                reason_codes,
                diagnostics,
                scan_truncated,
                spec_candidate_count,
                plan_candidate_count: 1,
                manifest_path,
                root,
                reason: reason.clone(),
                note: reason,
            });
        }

        if !stale_source_spec_linkage
            && !packet_buildability_failure
            && plan.workflow_state == "Engineering Approved"
            && report
                .as_ref()
                .map_or(false, |report| report.contract_state == "valid")
        {
            if read_only {
                return Ok(resolve_route(runtime, false, false)?);
            }
            return Ok(WorkflowRoute {
                schema_version: 2,
                status: String::from("implementation_ready"),
                next_skill: String::new(),
                spec_path: approved_spec.path.clone(),
                plan_path: plan.path.clone(),
                contract_state,
                reason_codes: vec![String::from("implementation_ready")],
                diagnostics: Vec::new(),
                scan_truncated,
                spec_candidate_count,
                plan_candidate_count: 1,
                manifest_path,
                root,
                reason: String::from("implementation_ready"),
                note: String::from("implementation_ready"),
            });
        }

        if plan.workflow_state == "Engineering Approved" && contract_state == "stale" {
            return Ok(WorkflowRoute {
                schema_version: 2,
                status: String::from("stale_plan"),
                next_skill: String::from("superpowers:writing-plans"),
                spec_path: approved_spec.path.clone(),
                plan_path: plan.path.clone(),
                contract_state,
                reason_codes,
                diagnostics,
                scan_truncated,
                spec_candidate_count,
                plan_candidate_count: 1,
                manifest_path,
                root,
                reason: reason.clone(),
                note: reason,
            });
        }

        return Ok(WorkflowRoute {
            schema_version: 2,
            status: String::from("plan_draft"),
            next_skill: String::from("superpowers:plan-eng-review"),
            spec_path: approved_spec.path.clone(),
            plan_path: plan.path.clone(),
            contract_state,
            reason_codes,
            diagnostics,
            scan_truncated,
            spec_candidate_count,
            plan_candidate_count: 1,
            manifest_path,
            root,
            reason: reason.clone(),
            note: reason,
        });
    }

    Ok(WorkflowRoute {
        schema_version: 2,
        status: String::from("spec_approved_needs_plan"),
        next_skill: String::from("superpowers:writing-plans"),
        spec_path: approved_spec.path.clone(),
        plan_path: preserved_plan_path.unwrap_or_default(),
        contract_state: String::from("unknown"),
        reason_codes: if missing_expected_plan {
            vec![String::from("missing_expected_plan")]
        } else {
            Vec::new()
        },
        diagnostics: Vec::new(),
        scan_truncated,
        spec_candidate_count,
        plan_candidate_count: plan_candidates.len(),
        manifest_path,
        root,
        reason: if missing_expected_plan {
            String::from("missing_expected_plan")
        } else {
            String::new()
        },
        note: if missing_expected_plan {
            String::from("missing_expected_plan")
        } else {
            String::new()
        },
    })
}

fn normalize_repo_path(path: &Path) -> Result<String, DiagnosticError> {
    let raw = path.to_str().ok_or_else(|| {
        DiagnosticError::new(
            FailureClass::InvalidRepoPath,
            "Workflow paths must be valid utf-8 repo-relative paths.",
        )
    })?;
    RepoPath::parse(raw).map(|path| path.as_str().to_owned())
}

fn scan_specs(repo_root: &Path) -> (Vec<WorkflowSpecCandidate>, Vec<WorkflowSpecCandidate>) {
    let mut candidates = Vec::new();
    let mut malformed = Vec::new();
    for path in markdown_files_under(&repo_root.join("docs/superpowers/specs")) {
        if let Ok(document) = parse_workflow_spec_candidate(&path) {
            if document.malformed_headers {
                malformed.push(document);
            } else {
                candidates.push(document);
            }
        }
    }
    (candidates, malformed)
}

fn scan_plans(repo_root: &Path) -> Vec<WorkflowPlanCandidate> {
    let mut candidates = Vec::new();
    for path in markdown_files_under(&repo_root.join("docs/superpowers/plans")) {
        if let Ok(document) = parse_workflow_plan_candidate(&path) {
            candidates.push(document);
        }
    }
    candidates
}

fn markdown_files_under(root: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    visit_markdown_files(root, &mut files);
    files
}

fn apply_fallback_limit<T>(mut candidates: Vec<T>) -> (Vec<T>, bool) {
    let Some(limit) = fallback_limit() else {
        return (candidates, false);
    };
    if candidates.len() <= limit {
        return (candidates, false);
    }
    let keep_from = candidates.len().saturating_sub(limit);
    (candidates.split_off(keep_from), true)
}

fn fallback_limit() -> Option<usize> {
    env::var("SUPERPOWERS_WORKFLOW_STATUS_FALLBACK_LIMIT")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .filter(|limit| *limit > 0)
}

fn visit_markdown_files(root: &Path, files: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(root) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            visit_markdown_files(&path, files);
        } else if path.extension().and_then(std::ffi::OsStr::to_str) == Some("md") {
            files.push(path);
        }
    }
}

fn read_session_entry(state_dir: &Path) -> SessionEntryState {
    let session_key = env::var("SUPERPOWERS_SESSION_KEY")
        .or_else(|_| env::var("PPID"))
        .unwrap_or_else(|_| String::from("current"));
    match session_entry::inspect(Some(&session_key)) {
        Ok(output) => SessionEntryState {
            outcome: output.outcome,
            decision_source: output.decision_source,
            session_key: output.session_key,
            decision_path: output.decision_path,
            policy_source: output.policy_source,
            persisted: output.persisted,
            failure_class: output.failure_class,
            reason: output.reason,
        },
        Err(error) => SessionEntryState {
            outcome: String::from("needs_user_choice"),
            decision_source: String::from("runtime_failure"),
            session_key,
            decision_path: state_dir
                .join("session-entry")
                .join("using-superpowers")
                .to_string_lossy()
                .into_owned(),
            policy_source: String::from("default"),
            persisted: false,
            failure_class: error.failure_class().to_owned(),
            reason: error.message().to_owned(),
        },
    }
}

pub fn sync_reason_codes(route: &WorkflowRoute) -> Vec<String> {
    route.reason_codes.clone()
}

pub fn report_contract_state(report: &AnalyzePlanReport) -> &str {
    &report.contract_state
}

pub fn write_workflow_schemas(output_dir: impl AsRef<Path>) -> Result<(), DiagnosticError> {
    let output_dir = output_dir.as_ref();
    fs::create_dir_all(output_dir).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!(
                "Could not create workflow schema directory {}: {err}",
                output_dir.display()
            ),
        )
    })?;

    let status_schema =
        serde_json::to_string_pretty(&schema_for!(WorkflowRoute)).map_err(|err| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Could not serialize workflow status schema: {err}"),
            )
        })?;
    let resolve_schema =
        serde_json::to_string_pretty(&schema_for!(WorkflowRoute)).map_err(|err| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Could not serialize workflow resolve schema: {err}"),
            )
        })?;

    fs::write(
        output_dir.join("workflow-status.schema.json"),
        status_schema,
    )
    .map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not write workflow-status schema: {err}"),
        )
    })?;
    fs::write(
        output_dir.join("workflow-resolve.schema.json"),
        resolve_schema,
    )
    .map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not write workflow-resolve schema: {err}"),
        )
    })?;

    Ok(())
}

fn parse_workflow_spec_candidate(path: &Path) -> Result<WorkflowSpecCandidate, DiagnosticError> {
    let source = fs::read_to_string(path).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not read spec candidate {}: {err}", path.display()),
        )
    })?;
    let workflow_state = parse_header_value(&source, "Workflow State").unwrap_or_default();
    let workflow_state_valid = matches!(workflow_state.as_str(), "Draft" | "CEO Approved");
    let spec_revision_valid = parse_header_value(&source, "Spec Revision")
        .ok()
        .and_then(|value| value.parse::<u32>().ok())
        .is_some();
    let last_reviewed_by_valid = parse_header_value(&source, "Last Reviewed By")
        .map(|value| !value.trim().is_empty())
        .unwrap_or(false);
    Ok(WorkflowSpecCandidate {
        path: repo_relative_path(path),
        workflow_state: if workflow_state_valid {
            workflow_state
        } else {
            String::from("Draft")
        },
        spec_revision: parse_header_value(&source, "Spec Revision")
            .ok()
            .and_then(|value| value.parse::<u32>().ok())
            .unwrap_or_default(),
        malformed_headers: !(workflow_state_valid && spec_revision_valid && last_reviewed_by_valid),
    })
}

fn parse_workflow_plan_candidate(path: &Path) -> Result<WorkflowPlanCandidate, DiagnosticError> {
    let source = fs::read_to_string(path).map_err(|err| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not read plan candidate {}: {err}", path.display()),
        )
    })?;
    let workflow_state = parse_header_value(&source, "Workflow State")?;
    let source_spec_path = parse_header_value(&source, "Source Spec")?
        .trim_matches('`')
        .to_owned();
    let source_spec_revision = parse_header_value(&source, "Source Spec Revision")
        .ok()
        .and_then(|value| value.parse::<u32>().ok());
    Ok(WorkflowPlanCandidate {
        path: repo_relative_path(path),
        workflow_state,
        source_spec_path,
        source_spec_revision,
    })
}

fn analyze_full_contract(
    repo_root: &Path,
    spec: &WorkflowSpecCandidate,
    plan: &WorkflowPlanCandidate,
) -> Option<AnalyzePlanReport> {
    if let Ok(json) = env::var("SUPERPOWERS_WORKFLOW_STATUS_TEST_ANALYZE_REPORT_JSON") {
        if let Ok(report) = serde_json::from_str::<AnalyzePlanReport>(&json) {
            return Some(report);
        }
    }

    let spec_path = repo_root.join(&spec.path);
    let plan_path = repo_root.join(&plan.path);
    let spec_source = fs::read_to_string(spec_path).ok()?;
    let plan_source = fs::read_to_string(plan_path).ok()?;
    Some(analyze_contract_report(
        &spec.path,
        &plan.path,
        &spec_source,
        &plan_source,
    ))
}

fn needs_packet_buildability_failure(report: &AnalyzePlanReport) -> bool {
    report.contract_state == "valid" && report.task_count > report.packet_buildable_tasks
}

fn workflow_contract_state(
    report: Option<&AnalyzePlanReport>,
    stale_source_spec_linkage: bool,
    packet_buildability_failure: bool,
) -> String {
    if stale_source_spec_linkage {
        return String::from("stale");
    }
    if packet_buildability_failure {
        return String::from("invalid");
    }
    match report {
        Some(report) => report.contract_state.clone(),
        None => String::from("unknown"),
    }
}

fn workflow_reason_codes(
    report: Option<&AnalyzePlanReport>,
    stale_source_spec_linkage: bool,
    packet_buildability_failure: bool,
) -> Vec<String> {
    let mut reason_codes = Vec::new();
    if stale_source_spec_linkage {
        reason_codes.push(String::from("stale_spec_plan_linkage"));
    }
    if packet_buildability_failure {
        reason_codes.push(String::from("packet_buildability_failure"));
    }
    if let Some(report) = report {
        for code in &report.reason_codes {
            if !reason_codes.iter().any(|existing| existing == code) {
                reason_codes.push(code.clone());
            }
        }
    }
    let header_reason_codes = reason_codes
        .iter()
        .filter(|code| is_plan_header_reason_code(code))
        .cloned()
        .collect::<Vec<_>>();
    if !header_reason_codes.is_empty() {
        return header_reason_codes;
    }
    reason_codes
}

fn workflow_diagnostics(
    plan: &WorkflowPlanCandidate,
    spec: &WorkflowSpecCandidate,
    report: Option<&AnalyzePlanReport>,
    stale_source_spec_linkage: bool,
    packet_buildability_failure: bool,
) -> Vec<WorkflowDiagnostic> {
    let mut diagnostics = Vec::new();
    if stale_source_spec_linkage {
        diagnostics.push(WorkflowDiagnostic {
            code: String::from("stale_spec_plan_linkage"),
            severity: String::from("error"),
            artifact: plan.path.clone(),
            message: format!(
                "Plan Source Spec {} does not match the approved spec path {}.",
                plan.source_spec_path, spec.path
            ),
            remediation: String::from(
                "Update the plan Source Spec header or rewrite the plan from the current approved spec.",
            ),
        });
    }
    if packet_buildability_failure {
        diagnostics.push(WorkflowDiagnostic {
            code: String::from("packet_buildability_failure"),
            severity: String::from("error"),
            artifact: plan.path.clone(),
            message: format!(
                "Only {} of {} plan tasks can produce task packets.",
                report.map_or(0, |report| report.packet_buildable_tasks),
                report.map_or(0, |report| report.task_count)
            ),
            remediation: String::from(
                "Repair the plan so every task has a buildable packet before treating it as ready.",
            ),
        });
    }
    if let Some(report) = report {
        let header_reason_present = report
            .reason_codes
            .iter()
            .any(|code| is_plan_header_reason_code(code));
        for diagnostic in &report.diagnostics {
            if header_reason_present && !is_plan_header_reason_code(&diagnostic.code) {
                continue;
            }
            if diagnostics
                .iter()
                .any(|existing| existing.code == diagnostic.code)
            {
                continue;
            }
            diagnostics.push(WorkflowDiagnostic {
                code: diagnostic.code.clone(),
                severity: String::from("error"),
                artifact: plan.path.clone(),
                message: diagnostic.message.clone(),
                remediation: String::from(
                    "Repair the plan contract so workflow status can route the current plan safely.",
                ),
            });
        }
    }
    diagnostics
}

fn parse_header_value(source: &str, header: &str) -> Result<String, DiagnosticError> {
    let prefix = format!("**{header}:** ");
    source
        .lines()
        .find_map(|line| line.strip_prefix(&prefix))
        .map(ToOwned::to_owned)
        .ok_or_else(|| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Missing or malformed {header} header."),
            )
        })
}

fn compatibility_reason(reason_codes: &[String]) -> String {
    if reason_codes
        .iter()
        .any(|code| is_plan_header_reason_code(code))
    {
        return String::from("malformed_plan_headers");
    }
    if reason_codes.is_empty() {
        String::new()
    } else {
        reason_codes.join(",")
    }
}

fn is_plan_header_reason_code(code: &str) -> bool {
    matches!(
        code,
        "missing_workflow_state"
            | "invalid_workflow_state"
            | "missing_plan_revision"
            | "missing_execution_mode"
            | "missing_source_spec"
            | "missing_source_spec_revision"
            | "missing_last_reviewed_by"
            | "invalid_last_reviewed_by"
    )
}

fn repo_relative_path(path: &Path) -> String {
    let normalized = path.display().to_string().replace('\\', "/");
    if let Some((_, suffix)) = normalized.split_once("/docs/") {
        return format!("docs/{suffix}");
    }
    path.file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or_default()
        .to_owned()
}
