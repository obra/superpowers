---
name: featureforge-upgrade
description: Use when FeatureForge detects an installed update and needs to upgrade the local runtime checkout before continuing
---

# /featureforge-upgrade

Upgrade FeatureForge to the latest version and summarize what changed.

## Inline upgrade flow

This section is referenced by all skill preambles when they detect `UPGRADE_AVAILABLE`.

### Step 1: Resolve install root

Resolve the active install once and reuse it for the rest of the flow:

```bash
_IS_FEATUREFORGE_RUNTIME_ROOT() {
  local candidate="$1"
  [ -n "$candidate" ] &&
  [ -x "$candidate/bin/featureforge" ] &&
  [ -f "$candidate/VERSION" ] &&
  { [ -d "$candidate/.git" ] || [ -f "$candidate/.git" ]; }
}

INSTALL_DIR=""
if [ -n "${_FEATUREFORGE_ROOT:-}" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$_FEATUREFORGE_ROOT"; then
  INSTALL_DIR="$_FEATUREFORGE_ROOT"
else
  _ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
  if [ -n "$_ROOT" ] && _IS_FEATUREFORGE_RUNTIME_ROOT "$_ROOT"; then
    INSTALL_DIR="$_ROOT"
  elif _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.featureforge/install"; then
    INSTALL_DIR="$HOME/.featureforge/install"
  elif _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.codex/featureforge"; then
    INSTALL_DIR="$HOME/.codex/featureforge"
  elif _IS_FEATUREFORGE_RUNTIME_ROOT "$HOME/.copilot/featureforge"; then
    INSTALL_DIR="$HOME/.copilot/featureforge"
  else
    echo "ERROR: featureforge install not found"
    exit 1
  fi
fi
FEATUREFORGE_BIN="$INSTALL_DIR/bin/featureforge"
echo "INSTALL_DIR=$INSTALL_DIR"
```

### Step 2: Resolve versions and auto-upgrade preference

Resolve the local and remote version before asking the user anything. This makes direct `/featureforge-upgrade` usage self-contained and uses the same remote source as `featureforge update-check`.

```bash
_COMPARE_FEATUREFORGE_VERSIONS() {
  local left="$1"
  local right="$2"
  local IFS=.
  local -a left_parts right_parts
  local max_parts=0
  local i left_value right_value

  read -r -a left_parts <<< "$left"
  read -r -a right_parts <<< "$right"

  if [ "${#left_parts[@]}" -gt "${#right_parts[@]}" ]; then
    max_parts="${#left_parts[@]}"
  else
    max_parts="${#right_parts[@]}"
  fi

  for ((i = 0; i < max_parts; i++)); do
    left_value="${left_parts[i]:-0}"
    right_value="${right_parts[i]:-0}"

    case "$left_value" in ''|*[!0-9]*) echo "unknown"; return 0 ;; esac
    case "$right_value" in ''|*[!0-9]*) echo "unknown"; return 0 ;; esac

    if ((10#$left_value < 10#$right_value)); then
      echo "upgrade"
      return 0
    fi

    if ((10#$left_value > 10#$right_value)); then
      echo "local_ahead"
      return 0
    fi
  done

  echo "equal"
}

LOCAL_VERSION="$(tr -d '[:space:]' < "$INSTALL_DIR/VERSION" 2>/dev/null || true)"
REMOTE_URL="${FEATUREFORGE_REMOTE_URL:-https://raw.githubusercontent.com/dmulcahey/featureforge/main/VERSION}"
REMOTE_VERSION="$(curl -sf --max-time 5 "$REMOTE_URL" 2>/dev/null || true)"
REMOTE_VERSION="$(printf '%s' "$REMOTE_VERSION" | tr -d '[:space:]')"

if ! printf '%s' "$LOCAL_VERSION" | grep -qE '^[0-9]+(\.[0-9]+)*$'; then
  LOCAL_VERSION="unknown"
fi

REMOTE_STATUS="ok"
if ! printf '%s' "$REMOTE_VERSION" | grep -qE '^[0-9]+(\.[0-9]+)*$'; then
  REMOTE_VERSION=""
  REMOTE_STATUS="unavailable"
fi

VERSION_RELATION="unknown"
if [ "$LOCAL_VERSION" != "unknown" ] && [ "$REMOTE_STATUS" = "ok" ]; then
  VERSION_RELATION="$(_COMPARE_FEATUREFORGE_VERSIONS "$LOCAL_VERSION" "$REMOTE_VERSION")"
fi

echo "LOCAL_VERSION=$LOCAL_VERSION"
echo "REMOTE_VERSION=$REMOTE_VERSION"
echo "REMOTE_STATUS=$REMOTE_STATUS"
echo "VERSION_RELATION=$VERSION_RELATION"
```

If `REMOTE_STATUS=unavailable` and this skill was invoked directly, stop before Step 3. Tell the user: `FeatureForge couldn't verify the latest version right now. Try /featureforge-upgrade again in a moment.`

If `VERSION_RELATION=unknown` and this skill was invoked directly, stop before Step 3. Tell the user: `FeatureForge couldn't compare the local and remote versions right now. Check $INSTALL_DIR/VERSION and try again.`

If `VERSION_RELATION=equal`, tell the user: `You're already on the latest known version (v$LOCAL_VERSION).`

If `VERSION_RELATION=local_ahead`, tell the user: `Your local FeatureForge install (v$LOCAL_VERSION) is newer than the fetched remote version (v$REMOTE_VERSION).`

If this skill was invoked from an `UPGRADE_AVAILABLE` handoff, the prompting layer already knows the display versions `{old}` and `{new}`. If the fresh fetch fails, keep using the handoff values and continue. If it was invoked directly, use `v$LOCAL_VERSION` and `v$REMOTE_VERSION` in the upgrade question below.

Only continue to auto-upgrade or the interactive question when `VERSION_RELATION=upgrade`, or when the skill entered from an `UPGRADE_AVAILABLE` handoff with known `{old}` and `{new}` display versions.

First, check if auto-upgrade is enabled:

```bash
_AUTO=""
[ "${FEATUREFORGE_AUTO_UPGRADE:-}" = "1" ] && _AUTO="true"
[ -z "$_AUTO" ] && _AUTO=$("$FEATUREFORGE_BIN" config get auto_upgrade 2>/dev/null || true)
echo "AUTO_UPGRADE=$_AUTO"
```

Direct manual `/featureforge-upgrade` runs are explicit user intent, so they ignore `update_check=false` and any snooze state. They still honor `auto_upgrade` when a real newer version exists.

**If `AUTO_UPGRADE=true` or `AUTO_UPGRADE=1`:** skip the interactive question, log `Auto-upgrading featureforge v{old} -> v{new}...` (or `Auto-upgrading featureforge v$LOCAL_VERSION -> v$REMOTE_VERSION...` for direct invocation), and continue to Step 3.

**Otherwise**, ask one interactive user question:
- Question: `featureforge v{new} is available (you're on v{old}). Upgrade now?`
  For direct invocation, substitute `v$REMOTE_VERSION` and `v$LOCAL_VERSION`.
- Options: `A) Yes, upgrade now B) Always keep me up to date C) Not now D) Never ask again`

**If "Yes, upgrade now":** continue to Step 3.

**If "Always keep me up to date":**

```bash
"$FEATUREFORGE_BIN" config set auto_upgrade true
```

Tell the user: `Auto-upgrade enabled. Future updates will install automatically.` Then continue to Step 3.

**If "Not now":** write snooze state with escalating backoff (24h, then 48h, then 1 week), then continue with the current skill.

```bash
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
_SNOOZE_FILE="$_SP_STATE_DIR/update-snoozed"
_REMOTE_VER="{new}"
_CUR_LEVEL=0
if [ -f "$_SNOOZE_FILE" ]; then
  _SNOOZED_VER=$(awk '{print $1}' "$_SNOOZE_FILE")
  if [ "$_SNOOZED_VER" = "$_REMOTE_VER" ]; then
    _CUR_LEVEL=$(awk '{print $2}' "$_SNOOZE_FILE")
    case "$_CUR_LEVEL" in *[!0-9]*) _CUR_LEVEL=0 ;; esac
  fi
fi
_NEW_LEVEL=$((_CUR_LEVEL + 1))
[ "$_NEW_LEVEL" -gt 3 ] && _NEW_LEVEL=3
mkdir -p "$_SP_STATE_DIR"
echo "$_REMOTE_VER $_NEW_LEVEL $(date +%s)" > "$_SNOOZE_FILE"
```

Tell the user the snooze duration and continue with the current skill.

**If "Never ask again":**

```bash
"$FEATUREFORGE_BIN" config set update_check false
```

Tell the user: `Update checks disabled. Run $FEATUREFORGE_BIN config set update_check true to re-enable.` Continue with the current skill.

### Step 3: Save old version

```bash
OLD_VERSION=$(cat "$INSTALL_DIR/VERSION" 2>/dev/null || echo "unknown")
```

### Step 4: Upgrade

```bash
cd "$INSTALL_DIR"
STASH_OUTPUT=$(git stash push --include-untracked -m "featureforge-upgrade-$(date +%Y%m%d-%H%M%S)" 2>&1 || true)
if ! git pull --ff-only; then
  echo "ERROR: featureforge upgrade failed during git pull"
  exit 1
fi
NEW_VERSION=$(cat "$INSTALL_DIR/VERSION" 2>/dev/null || echo "unknown")
echo "NEW_VERSION=$NEW_VERSION"
```

If `$STASH_OUTPUT` contains `Saved working directory`, warn the user that local changes were stashed and can be restored with `git stash pop`.

### Step 5: Write marker and clear cache

```bash
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
mkdir -p "$_SP_STATE_DIR"
rm -f "$_SP_STATE_DIR/last-update-check" "$_SP_STATE_DIR/update-snoozed"
if [ "$NEW_VERSION" != "$OLD_VERSION" ] && [ "$NEW_VERSION" != "unknown" ]; then
  echo "$OLD_VERSION" > "$_SP_STATE_DIR/just-upgraded-from"
fi
```

If `NEW_VERSION` is the same as `OLD_VERSION`, tell the user: `No version change detected; already on the latest installed version (v$NEW_VERSION).` Skip Step 6 and continue.

### Step 6: Show What's New

Read `$INSTALL_DIR/RELEASE-NOTES.md`. Summarize the most relevant items between the old version and the new version as 5-7 short bullets grouped by theme. Prefer user-facing runtime and workflow changes over internal refactors.

Format:

```text
featureforge v{new} — upgraded from v{old}!

What's new:
- [bullet 1]
- [bullet 2]
- ...
```

### Step 7: Continue

After the summary, continue with whatever skill the user originally invoked.

## Standalone usage

When invoked directly as `/featureforge-upgrade`, run Steps 1-6 above. The skill must resolve `LOCAL_VERSION`, fetch `REMOTE_VERSION`, and stop before `git pull` unless `REMOTE_VERSION` is a valid newer version. If the remote lookup fails, tell the user FeatureForge could not verify the latest version right now. If the pull leaves `NEW_VERSION` unchanged, tell the user: `You're already on the latest version (v$NEW_VERSION).`
