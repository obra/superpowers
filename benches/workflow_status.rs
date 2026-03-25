mod common;

use featureforge::git::discover_repo_identity;
use featureforge::workflow::manifest::{ManifestLoadResult, load_manifest, manifest_path};
use featureforge::workflow::status::WorkflowRuntime;

fn main() {
    let config = common::parse_args("workflow_status");
    let (repo_dir, state_dir) = common::create_workflow_fixture_repo();
    let repo = repo_dir.path();
    let state = state_dir.path();

    let report = common::run_benchmark(&config, || {
        let identity =
            discover_repo_identity(repo).expect("workflow benchmark repo identity should resolve");
        let manifest_path_buf = manifest_path(&identity, state);
        let (manifest, manifest_warning, manifest_recovery_reasons) =
            match load_manifest(&manifest_path_buf) {
                ManifestLoadResult::Missing => (None, None, Vec::new()),
                ManifestLoadResult::Loaded(manifest) => (Some(manifest), None, Vec::new()),
                ManifestLoadResult::Corrupt { backup_path } => (
                    None,
                    Some(format!(
                        "Recovered corrupt workflow manifest to {}",
                        backup_path.display()
                    )),
                    vec![String::from("corrupt_manifest_recovered")],
                ),
            };
        let runtime = WorkflowRuntime {
            identity,
            state_dir: state.to_path_buf(),
            manifest_path: manifest_path_buf,
            manifest,
            manifest_warning,
            manifest_recovery_reasons,
        };
        runtime
            .status()
            .expect("workflow status benchmark should succeed");
    });

    common::emit_report(&config, &report);
}
