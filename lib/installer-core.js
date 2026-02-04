const fs = require('fs');
const os = require('os');
const path = require('path');
const childProcess = require('child_process');

function isWindows() {
  return process.platform === 'win32';
}

function expandHome(p) {
  if (!p) return p;
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function run(cmd, args, options = {}) {
  const result = childProcess.spawnSync(cmd, args, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeRepoUrl(repo) {
  const trimmed = (repo || '').trim();
  if (!trimmed) return null;

  if (trimmed.includes('://') || trimmed.startsWith('git@')) return trimmed;
  return `https://github.com/${trimmed}.git`;
}

function pathExists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function readLinkTarget(linkPath) {
  try {
    const st = fs.lstatSync(linkPath);
    if (!st.isSymbolicLink()) return null;
    return fs.readlinkSync(linkPath);
  } catch {
    return null;
  }
}

function removePath(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function ensureSymlink({ linkPath, targetPath, force }) {
  if (pathExists(linkPath)) {
    const currentTarget = readLinkTarget(linkPath);
    if (currentTarget) {
      const resolvedCurrent = path.resolve(path.dirname(linkPath), currentTarget);
      if (resolvedCurrent === path.resolve(targetPath)) return;
    }

    if (!force) {
      throw new Error(`Refusing to replace existing path without --force: ${linkPath}`);
    }

    removePath(linkPath);
  }

  ensureDir(path.dirname(linkPath));

  const type = isWindows() ? 'junction' : 'dir';
  fs.symlinkSync(targetPath, linkPath, type);
}

function ensureFileSymlink({ linkPath, targetPath, force }) {
  if (pathExists(linkPath)) {
    const currentTarget = readLinkTarget(linkPath);
    if (currentTarget) {
      const resolvedCurrent = path.resolve(path.dirname(linkPath), currentTarget);
      if (resolvedCurrent === path.resolve(targetPath)) return;
    }

    if (!force) {
      throw new Error(`Refusing to replace existing path without --force: ${linkPath}`);
    }

    removePath(linkPath);
  }

  ensureDir(path.dirname(linkPath));
  fs.symlinkSync(targetPath, linkPath);
}

function upsertMarkedBlock(fileContent, startMarker, endMarker, blockContent) {
  const startIdx = fileContent.indexOf(startMarker);
  const endIdx = fileContent.indexOf(endMarker);

  const normalizedBlock = `${startMarker}\n${blockContent.trimEnd()}\n${endMarker}`;

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = fileContent.slice(0, startIdx).trimEnd();
    const after = fileContent.slice(endIdx + endMarker.length).trimStart();
    return `${before}\n\n${normalizedBlock}\n\n${after}`.trimEnd() + '\n';
  }

  // No markers found: append.
  const base = (fileContent || '').trimEnd();
  if (!base) return `${normalizedBlock}\n`;
  return `${base}\n\n${normalizedBlock}\n`;
}

function removeLegacyCodexBlockOutsideMarkers(fileContent, startMarker, endMarker) {
  const startIdx = fileContent.indexOf(startMarker);
  const endIdx = fileContent.indexOf(endMarker);

  // If markers exist, only clean outside the marked region.
  let before = fileContent;
  let marked = '';
  let after = '';

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    before = fileContent.slice(0, startIdx);
    marked = fileContent.slice(startIdx, endIdx + endMarker.length);
    after = fileContent.slice(endIdx + endMarker.length);
  }

  const stripOne = (s) => {
    const legacyHeader = '## Superpowers System';
    const legacyEnd = '</EXTREMELY_IMPORTANT>';
    const h = s.indexOf(legacyHeader);
    if (h === -1) return s;
    const e = s.indexOf(legacyEnd, h);
    if (e === -1) return s;

    const afterEndIdx = e + legacyEnd.length;
    const head = s.slice(0, h).trimEnd();
    const tail = s.slice(afterEndIdx).trimStart();
    if (!head) return tail;
    if (!tail) return head + '\n';
    return `${head}\n\n${tail}`;
  };

  const cleanedBefore = stripOne(before);
  const cleanedAfter = stripOne(after);

  if (!marked) return `${cleanedBefore}`;
  return `${cleanedBefore}${marked}${cleanedAfter}`;
}

function ensureCodexAgentsMd({ codexHomeDir, force }) {
  const agentsFile = path.join(codexHomeDir, 'AGENTS.md');

  const startMarker = '<!-- superpowers:codex-agents:start -->';
  const endMarker = '<!-- superpowers:codex-agents:end -->';

  const block = [
    '## Superpowers System',
    '',
    '<EXTREMELY_IMPORTANT>',
    'You have superpowers. Superpowers teach you new skills and capabilities. RIGHT NOW run: `~/.codex/superpowers/.codex/superpowers-codex bootstrap` and follow the instructions it returns.',
    '</EXTREMELY_IMPORTANT>',
  ].join('\n');

  if (pathExists(agentsFile) && !force) {
    const st = fs.lstatSync(agentsFile);
    if (st.isSymbolicLink()) {
      throw new Error(`Refusing to edit symlinked AGENTS.md without --force: ${agentsFile}`);
    }
  }

  ensureDir(path.dirname(agentsFile));

  const existing = pathExists(agentsFile) ? fs.readFileSync(agentsFile, 'utf8') : '';
  const withMarked = upsertMarkedBlock(existing, startMarker, endMarker, block);
  const next = removeLegacyCodexBlockOutsideMarkers(withMarked, startMarker, endMarker);
  if (next !== existing) {
    fs.writeFileSync(agentsFile, next, 'utf8');
  }
}

function gitStatusPorcelain(repoDir) {
  const r = run('git', ['status', '--porcelain'], { cwd: repoDir });
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || 'git status failed');
  }
  return r.stdout.trim();
}

function gitEnsureCloned({ repoUrl, repoDir }) {
  if (pathExists(path.join(repoDir, '.git'))) return;

  ensureDir(path.dirname(repoDir));
  const r = run('git', ['clone', repoUrl, repoDir]);
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || 'git clone failed');
  }
}

function gitCheckoutRef({ repoDir, ref }) {
  const r = run('git', ['checkout', ref], { cwd: repoDir });
  if (r.status !== 0) {
    throw new Error(r.stderr.trim() || `git checkout ${ref} failed`);
  }
}

function gitFastForwardUpdate({ repoDir }) {
  const fetch = run('git', ['fetch', '--all', '--prune'], { cwd: repoDir });
  if (fetch.status !== 0) {
    throw new Error(fetch.stderr.trim() || 'git fetch failed');
  }

  const pull = run('git', ['pull', '--ff-only'], { cwd: repoDir });
  if (pull.status !== 0) {
    throw new Error(pull.stderr.trim() || 'git pull --ff-only failed');
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      args._.push(a);
      continue;
    }

    const eq = a.indexOf('=');
    if (eq !== -1) {
      const k = a.slice(2, eq);
      const v = a.slice(eq + 1);
      args[k] = v;
      continue;
    }

    const k = a.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      args[k] = next;
      i += 1;
    } else {
      args[k] = true;
    }
  }
  return args;
}

function getDefaults() {
  const homeDir = os.homedir();
  return {
    repo: 'obra/superpowers',
    ref: 'main',
    dir: path.join(homeDir, '.superpowers'),
    force: false,
    update: true,
  };
}

function resolveInstallConfig(rawArgs) {
  const defaults = getDefaults();
  const repo = rawArgs.repo || defaults.repo;
  const repoUrl = normalizeRepoUrl(repo);
  if (!repoUrl) throw new Error('Missing --repo');

  return {
    repo,
    repoUrl,
    ref: rawArgs.ref || defaults.ref,
    dir: path.resolve(expandHome(rawArgs.dir || defaults.dir)),
    force: Boolean(rawArgs.force || false),
    update: !(rawArgs['no-update'] || false),
    updateAgents: !(rawArgs['no-agents'] || false),
  };
}

function getIdePaths(ide, centralDir) {
  const homeDir = os.homedir();

  if (ide === 'codex') {
    return {
      links: [
        {
          kind: 'dir',
          linkPath: path.join(homeDir, '.codex', 'superpowers'),
          targetPath: centralDir,
        },
      ],
      ensureDirs: [path.join(homeDir, '.codex', 'skills')],
    };
  }

  if (ide === 'kilocode') {
    return {
      links: [
        {
          kind: 'dir',
          linkPath: path.join(homeDir, '.config', 'kilocode', 'superpowers'),
          targetPath: centralDir,
        },
      ],
      ensureDirs: [path.join(homeDir, '.config', 'kilocode', 'skills')],
    };
  }

  if (ide === 'opencode') {
    return {
      links: [
        {
          kind: 'dir',
          linkPath: path.join(homeDir, '.config', 'opencode', 'superpowers'),
          targetPath: centralDir,
        },
        {
          kind: 'file',
          linkPath: path.join(homeDir, '.config', 'opencode', 'plugins', 'superpowers.js'),
          targetPath: path.join(centralDir, '.opencode', 'plugins', 'superpowers.js'),
        },
        {
          kind: 'dir',
          linkPath: path.join(homeDir, '.config', 'opencode', 'skills', 'superpowers'),
          targetPath: path.join(centralDir, 'skills'),
        },
      ],
      ensureDirs: [],
    };
  }

  throw new Error(`Unknown IDE: ${ide}`);
}

function runDoctor(ide, args) {
  const config = resolveInstallConfig(args);

  const result = {
    ok: true,
    checks: [],
  };

  const centralDirOk = pathExists(path.join(config.dir, '.git'));
  result.checks.push({
    name: 'central-repo',
    ok: centralDirOk,
    detail: config.dir,
  });

  const idePaths = getIdePaths(ide, config.dir);
  for (const d of idePaths.ensureDirs) {
    result.checks.push({ name: 'dir', ok: pathExists(d), detail: d });
  }

  for (const link of idePaths.links) {
    const exists = pathExists(link.linkPath);
    let ok = false;
    if (exists) {
      const currentTarget = readLinkTarget(link.linkPath);
      if (currentTarget) {
        const resolvedCurrent = path.resolve(path.dirname(link.linkPath), currentTarget);
        ok = resolvedCurrent === path.resolve(link.targetPath);
      }
    }

    result.checks.push({
      name: link.kind === 'file' ? 'file-link' : 'dir-link',
      ok,
      detail: `${link.linkPath} -> ${link.targetPath}`,
    });
  }

  for (const c of result.checks) {
    if (!c.ok) result.ok = false;
  }

  if (result.ok) {
    console.log('[OK] All checks passed');
  } else {
    console.log('[WARN] Some checks failed');
  }

  for (const c of result.checks) {
    console.log(`${c.ok ? '[OK]' : '[FAIL]'} ${c.name}: ${c.detail}`);
  }

  if (!result.ok) process.exitCode = 1;
}

function runInstallOrUpgrade(ide, args, mode) {
  const config = resolveInstallConfig(args);

  gitEnsureCloned({ repoUrl: config.repoUrl, repoDir: config.dir });

  const dirty = gitStatusPorcelain(config.dir);
  if (dirty && !config.force) {
    throw new Error(`Central repo has uncommitted changes. Re-run with --force to continue.\n${dirty}`);
  }

  gitCheckoutRef({ repoDir: config.dir, ref: config.ref });
  if (config.update) gitFastForwardUpdate({ repoDir: config.dir });

  const idePaths = getIdePaths(ide, config.dir);
  for (const d of idePaths.ensureDirs) {
    ensureDir(d);
  }

  for (const link of idePaths.links) {
    if (link.kind === 'file') {
      ensureFileSymlink({ linkPath: link.linkPath, targetPath: link.targetPath, force: config.force });
    } else {
      ensureSymlink({ linkPath: link.linkPath, targetPath: link.targetPath, force: config.force });
    }
  }

  if (ide === 'codex' && config.updateAgents) {
    ensureCodexAgentsMd({ codexHomeDir: path.join(os.homedir(), '.codex'), force: config.force });
  }

  console.log(`[OK] ${mode} complete for ${ide}`);
}

function runInstall(ide, args) {
  runInstallOrUpgrade(ide, args, 'install');
}

function runUpgrade(ide, args) {
  runInstallOrUpgrade(ide, args, 'upgrade');
}

module.exports = {
  parseArgs,
  runInstall,
  runUpgrade,
  runDoctor,
  getDefaults,
};
