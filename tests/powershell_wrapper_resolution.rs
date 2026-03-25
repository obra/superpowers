use std::fs;
use std::path::{Path, PathBuf};

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

fn read_utf8(path: impl AsRef<Path>) -> String {
    fs::read_to_string(path.as_ref())
        .unwrap_or_else(|error| panic!("{} should be readable: {error}", path.as_ref().display()))
}

#[test]
fn standalone_runtime_has_no_powershell_wrapper_entrypoints() {
    let root = repo_root();
    let powershell_entries = fs::read_dir(root.join("bin"))
        .expect("bin dir should be readable")
        .filter_map(Result::ok)
        .map(|entry| entry.file_name().to_string_lossy().into_owned())
        .filter(|name| name.ends_with(".ps1"))
        .collect::<Vec<_>>();
    assert!(
        powershell_entries.is_empty(),
        "standalone runtime should not ship PowerShell wrapper entrypoints: {powershell_entries:?}"
    );
    let compat_powershell = root.join("compat/powershell");
    if compat_powershell.exists() {
        assert!(
            fs::read_dir(&compat_powershell)
                .expect("compat/powershell should be readable")
                .next()
                .is_none(),
            "compat/powershell should be empty in the standalone runtime"
        );
    }
}

#[test]
fn canonical_prebuilt_manifest_and_assets_use_featureforge_names() {
    let root = repo_root();
    let manifest = read_utf8(root.join("bin/prebuilt/manifest.json"));
    for needle in [
        "bin/prebuilt/darwin-arm64/featureforge",
        "bin/prebuilt/darwin-arm64/featureforge.sha256",
        "bin/prebuilt/windows-x64/featureforge.exe",
        "bin/prebuilt/windows-x64/featureforge.exe.sha256",
    ] {
        assert!(
            manifest.contains(needle),
            "bin/prebuilt/manifest.json should contain {needle:?}"
        );
    }
    let manifest_json: serde_json::Value =
        serde_json::from_str(&manifest).expect("manifest json should parse");
    let targets = manifest_json["targets"]
        .as_object()
        .expect("manifest targets should be an object");
    for entry in targets.values() {
        let runtime_path = entry["binary_path"]
            .as_str()
            .expect("manifest binary path should be a string");
        let checksum_path = entry["checksum_path"]
            .as_str()
            .expect("manifest checksum path should be a string");
        assert!(
            runtime_path.contains("featureforge"),
            "prebuilt runtime path should stay on the FeatureForge basename: {runtime_path}"
        );
        assert!(
            checksum_path.contains("featureforge"),
            "prebuilt checksum path should stay on the FeatureForge basename: {checksum_path}"
        );
    }
    for relative in [
        "bin/prebuilt/darwin-arm64/featureforge",
        "bin/prebuilt/darwin-arm64/featureforge.sha256",
        "bin/prebuilt/windows-x64/featureforge.exe",
        "bin/prebuilt/windows-x64/featureforge.exe.sha256",
    ] {
        assert!(
            root.join(relative).is_file(),
            "renamed prebuilt runtime asset should exist: {relative}"
        );
    }
}
