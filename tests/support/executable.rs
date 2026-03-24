use std::fs;
use std::path::Path;

#[cfg(unix)]
pub fn make_executable(path: &Path) {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(0o755))
        .expect("path should be executable");
}

#[cfg(not(unix))]
pub fn make_executable(_: &Path) {}
