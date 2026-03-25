use std::fs;
use std::path::{Path, PathBuf};

pub fn canonical_install_root(home_dir: &Path) -> PathBuf {
    home_dir.join(".featureforge").join("install")
}

pub fn canonical_install_bin(home_dir: &Path) -> PathBuf {
    canonical_install_root(home_dir)
        .join("bin")
        .join("featureforge")
}

#[allow(dead_code)]
pub fn install_compiled_featureforge(home_dir: &Path) -> PathBuf {
    let source = PathBuf::from(env!("CARGO_BIN_EXE_featureforge"));
    let target = canonical_install_bin(home_dir);
    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).expect("canonical install bin directory should exist");
    }
    fs::copy(&source, &target).expect("compiled featureforge binary should copy into the install");
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&target, fs::Permissions::from_mode(0o755))
            .expect("copied featureforge binary should stay executable");
    }
    target
}
