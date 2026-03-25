mod common;

use std::path::PathBuf;

use featureforge::cli::plan_execution::StatusArgs;
use featureforge::execution::state::ExecutionRuntime;

fn main() {
    let config = common::parse_args("execution_status");
    let (repo_dir, state_dir) = common::create_execution_fixture_repo();
    let repo = repo_dir.path();
    let state = state_dir.path();

    let report = common::run_benchmark(&config, || {
        let mut runtime =
            ExecutionRuntime::discover(repo).expect("execution benchmark repo should resolve");
        runtime.state_dir = state.to_path_buf();
        runtime
            .status(&StatusArgs {
                plan: PathBuf::from(common::EXECUTION_PLAN_REL),
            })
            .expect("execution-status benchmark should succeed");
    });

    common::emit_report(&config, &report);
}
