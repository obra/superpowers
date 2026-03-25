use assert_cmd::cargo::CommandCargoExt;
use std::path::Path;
use std::process::{Command, Output};

use crate::process_support::run;

pub fn run_rust_featureforge(
    repo: Option<&Path>,
    state_dir: Option<&Path>,
    home_dir: Option<&Path>,
    envs: &[(&str, &str)],
    args: &[&str],
    context: &str,
) -> Output {
    run_rust_featureforge_with_env_control(repo, state_dir, home_dir, &[], envs, args, context)
}

pub fn run_rust_featureforge_with_env_control(
    repo: Option<&Path>,
    state_dir: Option<&Path>,
    home_dir: Option<&Path>,
    env_remove: &[&str],
    envs: &[(&str, &str)],
    args: &[&str],
    context: &str,
) -> Output {
    let mut command =
        Command::cargo_bin("featureforge").expect("featureforge cargo binary should be available");
    if let Some(repo) = repo {
        command.current_dir(repo);
    }
    if let Some(state_dir) = state_dir {
        command.env("FEATUREFORGE_STATE_DIR", state_dir);
    }
    if let Some(home_dir) = home_dir {
        command.env("HOME", home_dir);
    }
    for key in env_remove {
        command.env_remove(key);
    }
    for (key, value) in envs {
        command.env(key, value);
    }
    command.args(args);
    run(command, context)
}
