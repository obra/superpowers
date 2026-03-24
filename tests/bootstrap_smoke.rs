use assert_cmd::cargo::CommandCargoExt;

#[test]
fn superpowers_help_and_version_exist() {
    let mut help = std::process::Command::cargo_bin("superpowers")
        .expect("superpowers binary should be available for tests");
    let help_output = help
        .arg("--help")
        .output()
        .expect("help command should run");
    assert!(
        help_output.status.success(),
        "expected --help to succeed, got {:?}",
        help_output.status
    );
    let help_stdout = String::from_utf8(help_output.stdout).expect("help stdout should be utf-8");
    assert!(
        help_stdout.contains("superpowers"),
        "expected help output to mention the superpowers binary name, got:\n{help_stdout}"
    );

    let mut version = std::process::Command::cargo_bin("superpowers")
        .expect("superpowers binary should be available for tests");
    let version_output = version
        .arg("--version")
        .output()
        .expect("version command should run");
    assert!(
        version_output.status.success(),
        "expected --version to succeed, got {:?}",
        version_output.status
    );
    let version_stdout =
        String::from_utf8(version_output.stdout).expect("version stdout should be utf-8");
    assert!(
        version_stdout.starts_with("superpowers "),
        "expected version output to start with 'superpowers ', got:\n{version_stdout}"
    );
}
