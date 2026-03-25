#[path = "support/prebuilt.rs"]
mod prebuilt_support;

use std::fs;
use std::path::{Path, PathBuf};

use prebuilt_support::{
    DARWIN_ARM64_BINARY_REL, DARWIN_ARM64_CHECKSUM_REL, DARWIN_ARM64_TARGET,
    WINDOWS_X64_BINARY_REL, WINDOWS_X64_CHECKSUM_REL, WINDOWS_X64_TARGET,
};

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
        DARWIN_ARM64_BINARY_REL,
        DARWIN_ARM64_CHECKSUM_REL,
        WINDOWS_X64_BINARY_REL,
        WINDOWS_X64_CHECKSUM_REL,
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
    let target_keys = targets.keys().map(String::as_str).collect::<Vec<_>>();
    assert_eq!(
        target_keys,
        vec![DARWIN_ARM64_TARGET, WINDOWS_X64_TARGET],
        "checked-in prebuilt manifest should pin the supported target set"
    );
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
        DARWIN_ARM64_BINARY_REL,
        DARWIN_ARM64_CHECKSUM_REL,
        WINDOWS_X64_BINARY_REL,
        WINDOWS_X64_CHECKSUM_REL,
    ] {
        assert!(
            root.join(relative).is_file(),
            "renamed prebuilt runtime asset should exist: {relative}"
        );
    }
}

#[test]
fn refresh_prebuilt_scripts_pin_canonical_target_binary_names() {
    let root = repo_root();
    let shell_script = read_utf8(root.join("scripts/refresh-prebuilt-runtime.sh"));
    let powershell_script = read_utf8(root.join("scripts/refresh-prebuilt-runtime.ps1"));

    assert!(
        !shell_script.contains("FEATUREFORGE_PREBUILT_BINARY"),
        "shell refresh script should derive canonical binary names from the target contract"
    );
    assert!(
        !powershell_script.contains("FEATUREFORGE_PREBUILT_BINARY"),
        "powershell refresh script should derive canonical binary names from the target contract"
    );
    assert!(shell_script.contains(DARWIN_ARM64_TARGET));
    assert!(shell_script.contains("featureforge.exe"));
    assert!(powershell_script.contains(WINDOWS_X64_TARGET));
    assert!(powershell_script.contains("featureforge.exe"));
}
