use std::env;
use std::fs;
use std::path::{Path, PathBuf};

use schemars::{JsonSchema, schema_for};
use serde::Serialize;

use crate::cli::session_entry::{SessionEntryRecordArgs, SessionEntryResolveArgs};
use crate::diagnostics::{DiagnosticError, FailureClass};
use crate::paths::{
    featureforge_state_dir, normalize_identifier_token, write_atomic as write_atomic_file,
};

const MAX_MESSAGE_BYTES: u64 = 65_536;
const ACTIVE_SESSION_ENTRY_SKILL: &str = "using-featureforge";
const FEATUREFORGE_REENTRY_PHRASES: &[&str] = &[
    "use featureforge",
    "enable featureforge",
    "route this through featureforge",
    "run this through featureforge",
    "run this in featureforge",
];
const FEATUREFORGE_SKILLS: &[&str] = &[
    "brainstorming",
    "dispatching-parallel-agents",
    "document-release",
    "executing-plans",
    "finishing-a-development-branch",
    "plan-ceo-review",
    "plan-eng-review",
    "qa-only",
    "receiving-code-review",
    "requesting-code-review",
    "subagent-driven-development",
    "systematic-debugging",
    "test-driven-development",
    "using-git-worktrees",
    "using-featureforge",
    "verification-before-completion",
    "writing-plans",
    "writing-skills",
];
const FEATUREFORGE_COMMAND_ALIASES: &[&str] = &["brainstorm", "write-plan", "execute-plan"];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct SessionPromptOption {
    pub decision: String,
    pub label: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct SessionPrompt {
    pub question: String,
    pub recommended_option: String,
    pub options: Vec<SessionPromptOption>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, JsonSchema)]
pub struct SessionEntryResolveOutput {
    pub outcome: String,
    pub decision_source: String,
    pub session_key: String,
    pub decision_path: String,
    pub policy_source: String,
    pub persisted: bool,
    pub failure_class: String,
    pub reason: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<SessionPrompt>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum DecisionState {
    Enabled,
    Bypassed,
    Missing,
    Malformed,
}

pub fn resolve(
    args: &SessionEntryResolveArgs,
) -> Result<SessionEntryResolveOutput, DiagnosticError> {
    if matches!(
        env::var("FEATUREFORGE_SESSION_ENTRY_TEST_FAILPOINT").as_deref(),
        Ok("instruction_parse_failure")
    ) {
        return Err(DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            "Session-entry test failpoint injected an instruction parse failure.",
        ));
    }
    let runtime = SessionEntryRuntime::discover(args.session_key.as_deref())?;
    let message_text = runtime.load_message_text(&args.message_file)?;
    let decision_state = runtime.read_decision_state()?;

    match decision_state {
        DecisionState::Enabled => Ok(runtime.result(
            "enabled",
            "existing_enabled",
            true,
            "",
            "existing_enabled",
            None,
        )),
        DecisionState::Bypassed if message_requests_reentry(&message_text) => {
            if matches!(
                env::var("FEATUREFORGE_SESSION_ENTRY_TEST_FAILPOINT").as_deref(),
                Ok("reentry_write_failure")
            ) {
                return Ok(runtime.result(
                    "enabled",
                    "explicit_reentry_unpersisted",
                    false,
                    "DecisionWriteFailed",
                    "explicit_reentry_unpersisted",
                    None,
                ));
            }
            match runtime.write_decision("enabled") {
                Ok(()) => Ok(runtime.result(
                    "enabled",
                    "explicit_reentry",
                    true,
                    "",
                    "explicit_reentry",
                    None,
                )),
                Err(error) if error.failure_class_enum() == FailureClass::DecisionWriteFailed => {
                    Ok(runtime.result(
                        "enabled",
                        "explicit_reentry_unpersisted",
                        false,
                        "DecisionWriteFailed",
                        "explicit_reentry_unpersisted",
                        None,
                    ))
                }
                Err(error) => Err(error),
            }
        }
        DecisionState::Bypassed => Ok(runtime.result(
            "bypassed",
            "existing_bypassed",
            true,
            "",
            "existing_bypassed",
            None,
        )),
        DecisionState::Missing => Ok(runtime.result(
            "needs_user_choice",
            "missing",
            false,
            "",
            "missing",
            Some(default_prompt()),
        )),
        DecisionState::Malformed => Ok(runtime.result(
            "needs_user_choice",
            "malformed",
            false,
            "MalformedDecisionState",
            "malformed",
            Some(default_prompt()),
        )),
    }
}

pub fn inspect(session_key: Option<&str>) -> Result<SessionEntryResolveOutput, DiagnosticError> {
    if matches!(
        env::var("FEATUREFORGE_SESSION_ENTRY_TEST_FAILPOINT").as_deref(),
        Ok("instruction_parse_failure")
    ) {
        return Err(DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            "Session-entry test failpoint injected an instruction parse failure.",
        ));
    }
    let runtime = SessionEntryRuntime::discover(session_key)?;
    let decision_state = runtime.read_decision_state_read_only()?;

    match decision_state {
        DecisionState::Enabled => Ok(runtime.result(
            "enabled",
            "existing_enabled",
            true,
            "",
            "existing_enabled",
            None,
        )),
        DecisionState::Bypassed => Ok(runtime.result(
            "bypassed",
            "existing_bypassed",
            true,
            "",
            "existing_bypassed",
            None,
        )),
        DecisionState::Missing => Ok(runtime.result(
            "needs_user_choice",
            "missing",
            false,
            "",
            "missing",
            Some(default_prompt()),
        )),
        DecisionState::Malformed => Ok(runtime.result(
            "needs_user_choice",
            "malformed",
            false,
            "MalformedDecisionState",
            "malformed",
            Some(default_prompt()),
        )),
    }
}

pub fn record(args: &SessionEntryRecordArgs) -> Result<SessionEntryResolveOutput, DiagnosticError> {
    let runtime = SessionEntryRuntime::discover(args.session_key.as_deref())?;
    let decision = match args.decision.as_str() {
        "enabled" | "bypassed" => args.decision.as_str(),
        _ => {
            return Err(DiagnosticError::new(
                FailureClass::InvalidCommandInput,
                "record requires --decision enabled|bypassed.",
            ));
        }
    };
    runtime.write_decision(decision)?;
    Ok(runtime.result(
        decision,
        &format!("existing_{decision}"),
        true,
        "",
        &format!("recorded_{decision}"),
        None,
    ))
}

pub fn write_session_entry_schema(output_dir: &Path) -> Result<(), DiagnosticError> {
    fs::create_dir_all(output_dir).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!(
                "Could not create session-entry schema directory {}: {error}",
                output_dir.display()
            ),
        )
    })?;
    let schema =
        serde_json::to_string_pretty(&schema_for!(SessionEntryResolveOutput)).map_err(|error| {
            DiagnosticError::new(
                FailureClass::InstructionParseFailed,
                format!("Could not serialize session-entry resolve schema: {error}"),
            )
        })?;
    fs::write(output_dir.join("session-entry-resolve.schema.json"), schema).map_err(|error| {
        DiagnosticError::new(
            FailureClass::InstructionParseFailed,
            format!("Could not write session-entry resolve schema: {error}"),
        )
    })?;
    Ok(())
}

struct SessionEntryRuntime {
    session_key: String,
    canonical_path: PathBuf,
}

impl SessionEntryRuntime {
    fn discover(raw_session_key: Option<&str>) -> Result<Self, DiagnosticError> {
        let session_key = derive_session_key(raw_session_key)?;
        let state_dir = state_dir();
        Ok(Self {
            canonical_path: state_dir
                .join("session-entry")
                .join(ACTIVE_SESSION_ENTRY_SKILL)
                .join(&session_key),
            session_key,
        })
    }

    fn load_message_text(&self, message_file: &Path) -> Result<String, DiagnosticError> {
        let metadata = fs::metadata(message_file).map_err(|_| {
            DiagnosticError::new(
                FailureClass::InvalidCommandInput,
                "--message-file must point to a readable regular file.",
            )
        })?;
        if !metadata.is_file() {
            return Err(DiagnosticError::new(
                FailureClass::InvalidCommandInput,
                "--message-file must point to a readable regular file.",
            ));
        }
        if metadata.len() > max_message_bytes() {
            return Err(DiagnosticError::new(
                FailureClass::InvalidCommandInput,
                "Message file exceeds the supported maximum size.",
            ));
        }
        fs::read_to_string(message_file).map_err(|_| {
            DiagnosticError::new(
                FailureClass::InvalidCommandInput,
                "--message-file must point to a readable regular file.",
            )
        })
    }

    fn read_decision_state(&self) -> Result<DecisionState, DiagnosticError> {
        if self.canonical_path.exists() {
            return read_decision_file(&self.canonical_path);
        }
        Ok(DecisionState::Missing)
    }

    fn read_decision_state_read_only(&self) -> Result<DecisionState, DiagnosticError> {
        if self.canonical_path.exists() {
            return read_decision_file(&self.canonical_path);
        }
        Ok(DecisionState::Missing)
    }

    fn write_decision(&self, decision: &str) -> Result<(), DiagnosticError> {
        write_atomic_file(&self.canonical_path, format!("{decision}\n")).map_err(|error| {
            DiagnosticError::new(
                FailureClass::DecisionWriteFailed,
                format!(
                    "Could not persist the session-entry decision file {}: {error}",
                    self.canonical_path.display()
                ),
            )
        })?;
        Ok(())
    }

    fn result(
        &self,
        outcome: &str,
        decision_source: &str,
        persisted: bool,
        failure_class: &str,
        reason: &str,
        prompt: Option<SessionPrompt>,
    ) -> SessionEntryResolveOutput {
        SessionEntryResolveOutput {
            outcome: outcome.to_owned(),
            decision_source: decision_source.to_owned(),
            session_key: self.session_key.clone(),
            decision_path: self.canonical_path.to_string_lossy().into_owned(),
            policy_source: String::from("default"),
            persisted,
            failure_class: failure_class.to_owned(),
            reason: reason.to_owned(),
            prompt,
        }
    }
}

fn derive_session_key(raw_session_key: Option<&str>) -> Result<String, DiagnosticError> {
    let candidate = raw_session_key
        .map(str::to_owned)
        .or_else(|| env::var("FEATUREFORGE_SESSION_KEY").ok())
        .or_else(|| env::var("PPID").ok())
        .unwrap_or_else(|| String::from("current"));
    let normalized = normalize_identifier_token(&candidate);
    if normalized.is_empty() {
        return Err(DiagnosticError::new(
            FailureClass::InvalidCommandInput,
            "Session key may not be blank after normalization.",
        ));
    }
    Ok(normalized)
}

fn read_decision_file(path: &Path) -> Result<DecisionState, DiagnosticError> {
    if !path.is_file() {
        return Err(DiagnosticError::new(
            FailureClass::DecisionReadFailed,
            "Could not read the persisted session decision.",
        ));
    }
    let contents = fs::read_to_string(path).map_err(|_| {
        DiagnosticError::new(
            FailureClass::DecisionReadFailed,
            "Could not read the persisted session decision.",
        )
    })?;
    match contents.trim() {
        "enabled" => Ok(DecisionState::Enabled),
        "bypassed" => Ok(DecisionState::Bypassed),
        "" => Ok(DecisionState::Malformed),
        _ => Ok(DecisionState::Malformed),
    }
}

fn default_prompt() -> SessionPrompt {
    SessionPrompt {
        question: String::from("Use FeatureForge for this session?"),
        recommended_option: String::from("A"),
        options: vec![
            SessionPromptOption {
                decision: String::from("enabled"),
                label: String::from("Use FeatureForge"),
            },
            SessionPromptOption {
                decision: String::from("bypassed"),
                label: String::from("Bypass FeatureForge"),
            },
        ],
    }
}

fn message_requests_reentry(message: &str) -> bool {
    let lowered = message.to_lowercase().replace(['\'', '’'], "");
    for clause in lowered.split([',', '.', '!', '?', ';', '\n']) {
        let clause = clause.trim();
        if clause.is_empty() {
            continue;
        }
        if clause == "featureforge please" {
            return true;
        }
        if FEATUREFORGE_REENTRY_PHRASES
            .iter()
            .any(|phrase| clause_requests_phrase(clause, phrase))
            || clause_requests_skill_reentry(clause)
        {
            return true;
        }
    }
    false
}

fn clause_requests_skill_reentry(clause: &str) -> bool {
    FEATUREFORGE_SKILLS.iter().any(|skill| {
        clause_requests_phrase(clause, &format!("use {skill}"))
            || clause_requests_phrase(clause, &format!("use featureforge:{skill}"))
            || clause_requests_phrase(clause, &format!("featureforge:{skill}"))
            || clause_requests_phrase(clause, &format!("/{skill}"))
            || clause_requests_phrase(clause, &format!("${skill}"))
    }) || FEATUREFORGE_COMMAND_ALIASES
        .iter()
        .any(|alias| clause_requests_phrase(clause, &format!("/{alias}")))
}

fn clause_requests_phrase(clause: &str, phrase: &str) -> bool {
    clause.match_indices(phrase).any(|(index, _)| {
        let prefix = &clause[..index];
        !prefix_contains_negation(prefix)
    })
}

fn prefix_contains_negation(prefix: &str) -> bool {
    prefix.contains("do not")
        || prefix.contains("don't")
        || prefix.contains("dont")
        || prefix.contains("never")
        || prefix.contains("use no ")
        || prefix.contains("no ")
}

fn state_dir() -> PathBuf {
    featureforge_state_dir()
}

fn max_message_bytes() -> u64 {
    env::var("FEATUREFORGE_SESSION_ENTRY_MAX_MESSAGE_BYTES")
        .ok()
        .and_then(|value| value.parse::<u64>().ok())
        .unwrap_or(MAX_MESSAGE_BYTES)
}
