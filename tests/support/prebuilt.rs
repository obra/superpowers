use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;

pub struct PrebuiltManifestEntry<'a> {
    pub target: &'a str,
    pub binary_path: &'a str,
    pub checksum_path: &'a str,
}

pub fn sha256_checksum_line(binary_name: &str, contents: &str) -> String {
    let checksum = format!("{:x}", Sha256::digest(contents.as_bytes()));
    format!("{checksum}  {binary_name}\n")
}

pub fn write_prebuilt_artifact(
    root: &Path,
    binary_rel: &str,
    checksum_rel: &str,
    binary_contents: &str,
    checksum_contents: &str,
) {
    let binary_path = root.join(binary_rel);
    if let Some(parent) = binary_path.parent() {
        fs::create_dir_all(parent).expect("binary parent should be creatable");
    }
    fs::write(&binary_path, binary_contents).expect("prebuilt runtime should be writable");
    make_executable(&binary_path);

    let checksum_path = root.join(checksum_rel);
    if let Some(parent) = checksum_path.parent() {
        fs::create_dir_all(parent).expect("checksum parent should be creatable");
    }
    fs::write(&checksum_path, checksum_contents).expect("checksum should be writable");
}

pub fn write_prebuilt_manifest(
    root: &Path,
    runtime_revision: &str,
    entries: &[PrebuiltManifestEntry<'_>],
) {
    let manifest_path = root.join("bin/prebuilt/manifest.json");
    if let Some(parent) = manifest_path.parent() {
        fs::create_dir_all(parent).expect("manifest parent should be creatable");
    }

    let mut manifest_targets = serde_json::Map::new();
    for entry in entries {
        manifest_targets.insert(
            entry.target.to_owned(),
            json!({
                "binary_path": entry.binary_path,
                "checksum_path": entry.checksum_path,
            }),
        );
    }

    fs::write(
        &manifest_path,
        serde_json::to_vec_pretty(&json!({
            "runtime_revision": runtime_revision,
            "targets": manifest_targets,
        }))
        .expect("manifest should serialize"),
    )
    .expect("manifest should be writable");
}

fn make_executable(path: &Path) {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(path, fs::Permissions::from_mode(0o755))
            .expect("path should be executable");
    }
    #[cfg(not(unix))]
    {
        let _ = path;
    }
}
