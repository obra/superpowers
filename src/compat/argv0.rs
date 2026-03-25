use std::path::Path;

pub fn canonical_command_from_argv0(argv0: &str) -> &'static [&'static str] {
    let file_name = Path::new(argv0)
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or(argv0);
    let normalized = file_name.strip_suffix(".exe").unwrap_or(file_name);

    match normalized {
        "featureforge" => &[],
        "featureforge-workflow" => &["workflow"],
        "featureforge-workflow-status" => &["workflow", "status"],
        "featureforge-plan-contract" => &["plan", "contract"],
        "featureforge-plan-execution" => &["plan", "execution"],
        "featureforge-repo-safety" => &["repo-safety"],
        "featureforge-session-entry" => &["session-entry"],
        "featureforge-slug" => &["repo", "slug"],
        "featureforge-config" => &["config"],
        "featureforge-update-check" => &["update-check"],
        _ => &[],
    }
}
