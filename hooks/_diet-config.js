#!/usr/bin/env node
// sspower diet — shared configuration resolver
//
// Resolution order for default mode:
//   1. SSPOWER_DIET_DEFAULT environment variable
//   2. Config file defaultMode field:
//      - $XDG_CONFIG_HOME/sspower/diet.json (any platform, if set)
//      - ~/.config/sspower/diet.json (macOS / Linux fallback)
//      - %APPDATA%\sspower\diet.json (Windows fallback)
//   3. 'full'
//
// Adapted from caveman plugin (MIT, Julius Brussee).
// Security-hardened flag read/write preserved — flag path is predictable so
// we must refuse symlinks and cap read size to prevent local attacker
// redirection to secrets (e.g. ~/.ssh/id_rsa).

const fs = require('fs');
const path = require('path');
const os = require('os');

// Persistent modes only. One-shot skills (diet-commit, diet-review,
// compress-memory) do their work via slash commands and must never be
// written to the persistent flag.
const VALID_MODES = ['off', 'lite', 'full', 'ultra'];

function getConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'sspower');
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'sspower'
    );
  }
  return path.join(os.homedir(), '.config', 'sspower');
}

function getConfigPath() {
  return path.join(getConfigDir(), 'diet.json');
}

function getDefaultMode() {
  const envMode = process.env.SSPOWER_DIET_DEFAULT;
  if (envMode && VALID_MODES.includes(envMode.toLowerCase())) {
    return envMode.toLowerCase();
  }

  try {
    const config = JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
    if (config.defaultMode && VALID_MODES.includes(config.defaultMode.toLowerCase())) {
      return config.defaultMode.toLowerCase();
    }
  } catch (e) { /* missing or invalid — fall through */ }

  return 'full';
}

// Symlink-safe flag write. Refuses symlinks at target + parent dir.
// Atomic temp + rename, 0600, O_NOFOLLOW where available. Silent-fails.
function safeWriteFlag(flagPath, content) {
  try {
    const flagDir = path.dirname(flagPath);
    fs.mkdirSync(flagDir, { recursive: true });

    try {
      if (fs.lstatSync(flagDir).isSymbolicLink()) return;
    } catch (e) { return; }

    try {
      if (fs.lstatSync(flagPath).isSymbolicLink()) return;
    } catch (e) {
      if (e.code !== 'ENOENT') return;
    }

    const tempPath = path.join(flagDir, `.sspower-diet.${process.pid}.${Date.now()}`);
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | O_NOFOLLOW;
    let fd;
    try {
      fd = fs.openSync(tempPath, flags, 0o600);
      fs.writeSync(fd, String(content));
      try { fs.fchmodSync(fd, 0o600); } catch (e) { /* windows */ }
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
    fs.renameSync(tempPath, flagPath);
  } catch (e) { /* best-effort */ }
}

const MAX_FLAG_BYTES = 64;

function readFlag(flagPath) {
  try {
    let st;
    try { st = fs.lstatSync(flagPath); } catch (e) { return null; }
    if (st.isSymbolicLink() || !st.isFile()) return null;
    if (st.size > MAX_FLAG_BYTES) return null;

    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_RDONLY | O_NOFOLLOW;
    let fd, out;
    try {
      fd = fs.openSync(flagPath, flags);
      const buf = Buffer.alloc(MAX_FLAG_BYTES);
      const n = fs.readSync(fd, buf, 0, MAX_FLAG_BYTES, 0);
      out = buf.slice(0, n).toString('utf8');
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }

    const raw = out.trim().toLowerCase();
    if (!VALID_MODES.includes(raw)) return null;
    return raw;
  } catch (e) { return null; }
}

module.exports = { getDefaultMode, getConfigDir, getConfigPath, VALID_MODES, safeWriteFlag, readFlag };
