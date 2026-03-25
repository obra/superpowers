use std::path::PathBuf;

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

#[test]
fn standalone_runtime_has_no_shell_compat_launchers() {
    let root = repo_root();
    for relative in ["compat/bash", "compat/powershell"] {
        let dir = root.join(relative);
        if !dir.exists() {
            continue;
        }
        let entries = std::fs::read_dir(&dir)
            .expect("compat dir should be readable")
            .filter_map(Result::ok)
            .collect::<Vec<_>>();
        assert!(
            entries.is_empty(),
            "compatibility launcher directories should be empty in the standalone runtime: {relative}"
        );
    }
    let bin_entries = std::fs::read_dir(root.join("bin"))
        .expect("bin dir should be readable")
        .filter_map(Result::ok)
        .map(|entry| entry.file_name().to_string_lossy().into_owned())
        .filter(|name| name.ends_with("runtime-common.sh") || name.ends_with("pwsh-common.ps1"))
        .collect::<Vec<_>>();
    assert!(
        bin_entries.is_empty(),
        "standalone runtime should not ship shell compatibility helper files: {bin_entries:?}"
    );
}
