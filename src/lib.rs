use std::ffi::OsString;
use std::path::PathBuf;

use clap::{CommandFactory, Parser};
use cli::runtime_root::RuntimeRootFieldCli;
use cli::{Command, PlanCommand, RepoCommand};
use diagnostics::{DiagnosticError, FailureClass, JsonFailure};
use serde_json::{Value, json};

pub mod cli;
pub mod compat;
pub mod config;
pub mod contracts;
pub mod diagnostics;
pub mod execution;
pub mod git;
pub mod instructions;
pub mod output;
pub mod paths;
pub mod repo_safety;
pub mod runtime_root;
pub mod update_check;
pub mod workflow;

pub fn run() -> std::process::ExitCode {
    let args = canonicalized_args();
    let cli = match cli::Cli::try_parse_from(args) {
        Ok(cli) => cli,
        Err(error) => match error.kind() {
            clap::error::ErrorKind::DisplayHelp | clap::error::ErrorKind::DisplayVersion => {
                print!("{error}");
                return std::process::ExitCode::SUCCESS;
            }
            _ => {
                return emit_json::<Value, JsonFailure>(Err(JsonFailure::new(
                    FailureClass::InvalidCommandInput,
                    error.to_string(),
                )));
            }
        },
    };

    match cli.command {
        Some(Command::Config(config_cli)) => match config_cli.command {
            cli::config::ConfigCommand::Get(args) => emit_text(config::get(&args)),
            cli::config::ConfigCommand::Set(args) => emit_text(config::set(&args)),
            cli::config::ConfigCommand::List => emit_text(config::list()),
        },
        Some(Command::Plan(plan_cli)) => match plan_cli.command {
            PlanCommand::Contract(plan_contract_cli) => match plan_contract_cli.command {
                cli::plan_contract::PlanContractCommand::Lint(args) => {
                    contracts::runtime::run_lint(&args)
                }
                cli::plan_contract::PlanContractCommand::AnalyzePlan(args) => {
                    contracts::runtime::run_analyze_plan(&args)
                }
                cli::plan_contract::PlanContractCommand::BuildTaskPacket(args) => {
                    contracts::runtime::run_build_task_packet(&args)
                }
            },
            PlanCommand::Execution(plan_execution_cli) => {
                match execution::state::ExecutionRuntime::discover(
                    &std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
                ) {
                    Ok(runtime) => match plan_execution_cli.command {
                        cli::plan_execution::PlanExecutionCommand::Status(args) => {
                            emit_json(runtime.status(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::Recommend(args) => {
                            emit_json(runtime.recommend(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::Preflight(args) => {
                            emit_json(runtime.preflight(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::GateContract(args) => {
                            emit_json(runtime.gate_contract(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::RecordContract(args) => {
                            emit_json(runtime.record_contract(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::GateEvaluator(args) => {
                            emit_json(runtime.gate_evaluator(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::RecordEvaluation(args) => {
                            emit_json(runtime.record_evaluation(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::GateHandoff(args) => {
                            emit_json(runtime.gate_handoff(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::RecordHandoff(args) => {
                            emit_json(runtime.record_handoff(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::GateReview(args) => {
                            emit_json(runtime.gate_review_dispatch(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::GateFinish(args) => {
                            emit_json(runtime.gate_finish(&args))
                        }
                        cli::plan_execution::PlanExecutionCommand::Begin(args) => {
                            emit_json(execution::mutate::begin(&runtime, &args))
                        }
                        cli::plan_execution::PlanExecutionCommand::Note(args) => {
                            emit_json(execution::mutate::note(&runtime, &args))
                        }
                        cli::plan_execution::PlanExecutionCommand::Complete(args) => {
                            emit_json(execution::mutate::complete(&runtime, &args))
                        }
                        cli::plan_execution::PlanExecutionCommand::Reopen(args) => {
                            emit_json(execution::mutate::reopen(&runtime, &args))
                        }
                        cli::plan_execution::PlanExecutionCommand::Transfer(args) => {
                            emit_json(execution::mutate::transfer(&runtime, &args))
                        }
                    },
                    Err(error) => emit_json::<Value, _>(Err(error)),
                }
            }
        },
        Some(Command::Repo(repo_cli)) => match repo_cli.command {
            RepoCommand::Slug(_) => emit_text(render_slug_output(
                &std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            )),
            RepoCommand::RuntimeRoot(args) => {
                if args.json {
                    emit_json(runtime_root::resolve_current_output())
                } else if args.path {
                    emit_text(runtime_root::resolve_current_path_output())
                } else if let Some(field) = args.field {
                    let field = match field {
                        RuntimeRootFieldCli::UpgradeEligible => {
                            runtime_root::RuntimeRootField::UpgradeEligible
                        }
                    };
                    emit_text(runtime_root::resolve_current_field_output(field))
                } else {
                    emit_json::<Value, JsonFailure>(Err(JsonFailure::new(
                        FailureClass::InvalidCommandInput,
                        "repo runtime-root requires either --json, --path, or --field.",
                    )))
                }
            }
        },
        Some(Command::RepoSafety(repo_safety_cli)) => {
            match repo_safety::RepoSafetyRuntime::discover(
                &std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")),
            ) {
                Ok(runtime) => match repo_safety_cli.command {
                    cli::repo_safety::RepoSafetyCommand::Check(args) => {
                        emit_json(runtime.check(&args))
                    }
                    cli::repo_safety::RepoSafetyCommand::Approve(args) => {
                        emit_json(runtime.approve(&args))
                    }
                },
                Err(error) => emit_json::<Value, JsonFailure>(Err(error.into())),
            }
        }
        Some(Command::UpdateCheck(args)) => emit_text(update_check::check(&args)),
        Some(Command::Workflow(workflow_cli)) => {
            let current_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
            match workflow_cli.command {
                cli::workflow::WorkflowCommand::Status(args) => {
                    match workflow::status::WorkflowRuntime::discover(&current_dir) {
                        Ok(mut runtime) => {
                            let route = if args.refresh {
                                runtime.status_refresh()
                            } else {
                                runtime.status()
                            };
                            if args.summary {
                                emit_text(route.map(render_workflow_status_summary))
                            } else {
                                emit_json(route)
                            }
                        }
                        Err(error) => emit_json::<Value, JsonFailure>(Err(error.into())),
                    }
                }
                cli::workflow::WorkflowCommand::Resolve => {
                    match workflow::status::WorkflowRuntime::discover_read_only(&current_dir) {
                        Ok(runtime) => {
                            emit_workflow_resolve_json(runtime.resolve().map_err(JsonFailure::from))
                        }
                        Err(error) => emit_workflow_resolve_json(Err(
                            map_read_only_workflow_failure(error.into()),
                        )),
                    }
                }
                cli::workflow::WorkflowCommand::Expect(args) => {
                    match workflow::status::WorkflowRuntime::discover(&current_dir) {
                        Ok(mut runtime) => emit_json(runtime.expect(args.artifact, &args.path)),
                        Err(error) => emit_json::<Value, JsonFailure>(Err(error.into())),
                    }
                }
                cli::workflow::WorkflowCommand::Sync(args) => {
                    match workflow::status::WorkflowRuntime::discover(&current_dir) {
                        Ok(mut runtime) => {
                            emit_json(runtime.sync(args.artifact, args.path.as_deref()))
                        }
                        Err(error) => emit_json::<Value, JsonFailure>(Err(error.into())),
                    }
                }
                cli::workflow::WorkflowCommand::PlanFidelity(plan_fidelity_cli) => {
                    match plan_fidelity_cli.command {
                        cli::workflow::WorkflowPlanFidelityCommand::Record(args) => {
                            let result =
                                workflow::status::record_plan_fidelity_receipt(&current_dir, &args);
                            if args.json {
                                emit_json(result)
                            } else {
                                emit_text(result.map(workflow::status::render_plan_fidelity_record))
                            }
                        }
                    }
                }
                cli::workflow::WorkflowCommand::Next => emit_text(
                    workflow::operator::render_next(&current_dir)
                        .map_err(map_read_only_workflow_failure),
                ),
                cli::workflow::WorkflowCommand::Artifacts => emit_text(
                    workflow::operator::render_artifacts(&current_dir)
                        .map_err(map_read_only_workflow_failure),
                ),
                cli::workflow::WorkflowCommand::Explain => emit_text(
                    workflow::operator::render_explain(&current_dir)
                        .map_err(map_read_only_workflow_failure),
                ),
                cli::workflow::WorkflowCommand::Phase(args) => {
                    if args.json {
                        emit_json(
                            workflow::operator::phase(&current_dir)
                                .map_err(map_read_only_workflow_failure),
                        )
                    } else {
                        emit_text(
                            workflow::operator::render_phase(&current_dir)
                                .map_err(map_read_only_workflow_failure),
                        )
                    }
                }
                cli::workflow::WorkflowCommand::Doctor(args) => {
                    if args.json {
                        emit_json(
                            workflow::operator::doctor(&current_dir)
                                .map_err(map_read_only_workflow_failure),
                        )
                    } else {
                        emit_text(
                            workflow::operator::render_doctor(&current_dir)
                                .map_err(map_read_only_workflow_failure),
                        )
                    }
                }
                cli::workflow::WorkflowCommand::Handoff(args) => {
                    if args.json {
                        emit_json(
                            workflow::operator::handoff(&current_dir)
                                .map_err(map_read_only_workflow_failure),
                        )
                    } else {
                        emit_text(
                            workflow::operator::render_handoff(&current_dir)
                                .map_err(map_read_only_workflow_failure),
                        )
                    }
                }
                cli::workflow::WorkflowCommand::Preflight(args) => {
                    let result = workflow::operator::preflight(&current_dir, &args);
                    if args.json {
                        emit_json(result)
                    } else {
                        emit_text(result.map(|gate| {
                            workflow::operator::render_gate("Execution preflight", &gate)
                        }))
                    }
                }
                cli::workflow::WorkflowCommand::Gate(gate_cli) => {
                    match gate_cli.command {
                        cli::workflow::WorkflowGateCommand::Review(args) => {
                            let result = workflow::operator::gate_review(&current_dir, &args);
                            if args.json {
                                emit_json(result)
                            } else {
                                emit_text(result.map(|gate| {
                                    workflow::operator::render_gate("Review gate", &gate)
                                }))
                            }
                        }
                        cli::workflow::WorkflowGateCommand::Finish(args) => {
                            let result = workflow::operator::gate_finish(&current_dir, &args);
                            if args.json {
                                emit_json(result)
                            } else {
                                emit_text(result.map(|gate| {
                                    workflow::operator::render_gate("Finish gate", &gate)
                                }))
                            }
                        }
                    }
                }
            }
        }
        None => {
            let mut command = cli::Cli::command();
            print!("{}", command.render_help());
            println!();
            std::process::ExitCode::SUCCESS
        }
    }
}

fn canonicalized_args() -> Vec<OsString> {
    let mut args = std::env::args_os();
    let argv0 = args
        .next()
        .unwrap_or_else(|| OsString::from("featureforge"));
    let user_args = args.collect::<Vec<_>>();
    let injected = compat::argv0::canonical_command_from_argv0(&argv0.to_string_lossy());
    let mut canonicalized = vec![argv0.clone()];
    canonicalized.extend(injected.iter().map(OsString::from));

    let overlap = (0..=std::cmp::min(injected.len(), user_args.len()))
        .rev()
        .find(|overlap| {
            injected[injected.len().saturating_sub(*overlap)..]
                .iter()
                .zip(user_args.iter().take(*overlap))
                .all(|(expected, actual)| actual.to_string_lossy() == *expected)
        })
        .unwrap_or(0);

    canonicalized.extend(user_args.into_iter().skip(overlap));
    canonicalized
}

fn emit_json<T, E>(result: Result<T, E>) -> std::process::ExitCode
where
    T: serde::Serialize,
    E: Into<JsonFailure>,
{
    match result {
        Ok(value) => match serde_json::to_string(&value) {
            Ok(json) => {
                println!("{json}");
                std::process::ExitCode::SUCCESS
            }
            Err(error) => {
                eprintln!("Could not serialize workflow output: {error}");
                std::process::ExitCode::from(1)
            }
        },
        Err(error) => match serde_json::to_string(&error.into()) {
            Ok(json) => {
                eprintln!("{json}");
                std::process::ExitCode::from(1)
            }
            Err(serialize_error) => {
                eprintln!("Could not serialize error output: {serialize_error}");
                std::process::ExitCode::from(1)
            }
        },
    }
}

fn emit_text<E>(result: Result<String, E>) -> std::process::ExitCode
where
    E: Into<JsonFailure>,
{
    match result {
        Ok(text) => {
            if !text.is_empty() {
                print!("{text}");
            }
            std::process::ExitCode::SUCCESS
        }
        Err(error) => {
            let failure = error.into();
            eprintln!("{}: {}", failure.error_class, failure.message);
            std::process::ExitCode::from(1)
        }
    }
}

fn emit_workflow_resolve_json(
    result: Result<workflow::status::WorkflowRoute, JsonFailure>,
) -> std::process::ExitCode {
    match result {
        Ok(route) => {
            let manifest_source_path = route.manifest_path.clone();
            match serde_json::to_value(route) {
                Ok(Value::Object(mut object)) => {
                    object.insert(
                        String::from("outcome"),
                        Value::String(String::from("resolved")),
                    );
                    object.insert(
                        String::from("manifest_source_path"),
                        Value::String(manifest_source_path),
                    );
                    match serde_json::to_string(&Value::Object(object)) {
                        Ok(json) => {
                            println!("{json}");
                            std::process::ExitCode::SUCCESS
                        }
                        Err(error) => {
                            eprintln!("Could not serialize workflow resolve output: {error}");
                            std::process::ExitCode::from(1)
                        }
                    }
                }
                Ok(_) => {
                    eprintln!("Could not serialize workflow resolve output: expected object");
                    std::process::ExitCode::from(1)
                }
                Err(error) => {
                    eprintln!("Could not serialize workflow resolve output: {error}");
                    std::process::ExitCode::from(1)
                }
            }
        }
        Err(failure) => match serde_json::to_string(&json!({
            "outcome": "runtime_failure",
            "failure_class": failure.error_class,
            "message": failure.message,
        })) {
            Ok(json) => {
                eprintln!("{json}");
                std::process::ExitCode::from(1)
            }
            Err(error) => {
                eprintln!("Could not serialize workflow resolve failure: {error}");
                std::process::ExitCode::from(1)
            }
        },
    }
}

fn render_slug_output(current_dir: &std::path::Path) -> Result<String, DiagnosticError> {
    let identity = git::discover_slug_identity(current_dir);
    Ok(format!(
        "SLUG={}\nBRANCH={}\n",
        shell_quote(&identity.repo_slug),
        shell_quote(&identity.safe_branch)
    ))
}

fn map_read_only_workflow_failure(failure: JsonFailure) -> JsonFailure {
    if failure.error_class == FailureClass::BranchDetectionFailed.as_str() {
        JsonFailure::new(
            FailureClass::RepoContextUnavailable,
            "Read-only workflow resolution requires a git repo.",
        )
    } else {
        failure
    }
}

fn render_workflow_status_summary(route: workflow::status::WorkflowRoute) -> String {
    let next = if route.status == "implementation_ready" {
        "execution_preflight"
    } else {
        route.next_skill.as_str()
    };
    format!(
        "status={} next={} spec={} plan={} reason={}\n",
        route.status, next, route.spec_path, route.plan_path, route.reason
    )
}

fn shell_quote(value: &str) -> String {
    if value
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '/' | '.' | '_' | '-'))
    {
        value.to_owned()
    } else {
        format!("'{}'", value.replace('\'', "'\"'\"'"))
    }
}
