use std::path::Path;

pub fn canonical_command_from_argv0(argv0: &str) -> &'static [&'static str] {
    let file_name = Path::new(argv0)
        .file_name()
        .and_then(std::ffi::OsStr::to_str)
        .unwrap_or(argv0);
    let normalized = file_name.strip_suffix(".exe").unwrap_or(file_name);

    match normalized {
        "superpowers" => &[],
        "superpowers-workflow" => &["workflow"],
        "superpowers-workflow-status" => &["workflow", "status"],
        "superpowers-plan-contract" => &["plan", "contract"],
        "superpowers-plan-execution" => &["plan", "execution"],
        "superpowers-repo-safety" => &["repo-safety"],
        "superpowers-session-entry" => &["session-entry"],
        "superpowers-slug" => &["repo", "slug"],
        "superpowers-config" => &["config"],
        "superpowers-update-check" => &["update-check"],
        "superpowers-migrate-install" => &["install", "migrate"],
        _ => &[],
    }
}
