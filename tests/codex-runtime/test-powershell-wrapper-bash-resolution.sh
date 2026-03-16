#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER="$REPO_ROOT/bin/superpowers-pwsh-common.ps1"

pwsh_bin="$(command -v pwsh || command -v powershell || true)"
if [[ -z "$pwsh_bin" ]]; then
  echo "Skipping PowerShell wrapper bash-resolution test: no pwsh or powershell binary found."
  exit 0
fi

tmp_root="$(mktemp -d)"
trap 'rm -rf "$tmp_root"' EXIT

generic_dir="$tmp_root/generic"
git_cmd_dir="$tmp_root/Git/cmd"
git_bin_dir="$tmp_root/Git/bin"
override_dir="$tmp_root/override"

mkdir -p "$generic_dir" "$git_cmd_dir" "$git_bin_dir" "$override_dir"

cat > "$generic_dir/bash" <<'SH'
#!/usr/bin/env bash
exit 0
SH

cat > "$git_cmd_dir/git" <<'SH'
#!/usr/bin/env bash
exit 0
SH

cat > "$git_bin_dir/bash.exe" <<'SH'
#!/usr/bin/env bash
exit 0
SH

cat > "$override_dir/bash" <<'SH'
#!/usr/bin/env bash
exit 0
SH

chmod +x "$generic_dir/bash" "$git_cmd_dir/git" "$git_bin_dir/bash.exe" "$override_dir/bash"

selected="$(
  PATH="$generic_dir:$git_cmd_dir:$PATH" \
    "$pwsh_bin" -NoLogo -NoProfile -Command ". '$HELPER'; Get-SuperpowersBashPath"
)"
if [[ "$selected" != "$git_bin_dir/bash.exe" ]]; then
  echo "Expected PowerShell helper to prefer Git Bash over a generic bash on PATH"
  echo "Actual selection: $selected"
  exit 1
fi

selected="$(
  PATH="$generic_dir:$git_cmd_dir:$PATH" \
    SUPERPOWERS_BASH_PATH="$override_dir/bash" \
    "$pwsh_bin" -NoLogo -NoProfile -Command ". '$HELPER'; Get-SuperpowersBashPath"
)"
if [[ "$selected" != "$override_dir/bash" ]]; then
  echo "Expected SUPERPOWERS_BASH_PATH to override wrapper bash resolution"
  echo "Actual selection: $selected"
  exit 1
fi

echo "PowerShell wrapper bash-resolution regression test passed."
