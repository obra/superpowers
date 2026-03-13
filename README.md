<div align="center">

# ⚡ Superpowers

## Agentic skills framework & software development methodology that *actually ships*

<p>
  <a href="https://github.com/obra/superpowers/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/obra/superpowers?style=for-the-badge&color=ffcc00&labelColor=1b1b1b"></a>
  <a href="https://github.com/obra/superpowers/network/members"><img alt="GitHub forks" src="https://img.shields.io/github/forks/obra/superpowers?style=for-the-badge&color=7c3aed&labelColor=1b1b1b"></a>
  <a href="https://github.com/obra/superpowers/issues"><img alt="Issues" src="https://img.shields.io/github/issues/obra/superpowers?style=for-the-badge&color=22c55e&labelColor=1b1b1b"></a>
  <a href="https://github.com/obra/superpowers/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/obra/superpowers?style=for-the-badge&color=0ea5e9&labelColor=1b1b1b"></a>
</p>

<p>
  <a href="https://github.com/sponsors/obra"><img alt="Sponsor" src="https://img.shields.io/badge/Sponsor-obra-ff4d8d?style=for-the-badge&labelColor=1b1b1b"></a>
  <a href="https://claude.com/plugins/superpowers"><img alt="Claude plugin" src="https://img.shields.io/badge/Claude%20Plugin-Official%20Marketplace-f97316?style=for-the-badge&labelColor=1b1b1b"></a>
</p>

</div>

---

## 🎯 What is Superpowers?

**Superpowers** is a **composable skills library + workflow** for coding agents.

It changes the default agent behavior from:

> “Write code immediately”  
to  
> “Clarify → Spec → Plan → Execute → Review → Verify”

So your agent becomes a **repeatable shipping machine** instead of a one-shot code generator.

---

## 🧠 The “Superpowers loop”

<table>
  <tr>
    <td width="20%" align="center"><b>1</b><br/>🧩 Clarify</td>
    <td width="20%" align="center"><b>2</b><br/>🧱 Spec</td>
    <td width="20%" align="center"><b>3</b><br/>🗺️ Plan</td>
    <td width="20%" align="center"><b>4</b><br/>🛠️ Execute</td>
    <td width="20%" align="center"><b>5</b><br/>🧪 Verify</td>
  </tr>
  <tr>
    <td align="center">Ask the right questions first</td>
    <td align="center">Write a design you can read</td>
    <td align="center">Break work into tiny tasks</td>
    <td align="center">Use worktrees + subagents</td>
    <td align="center">TDD + evidence-based completion</td>
  </tr>
</table>

---

## ✨ What you get (in practice)

### ✅ Reliability upgrades
- **Specs you can approve** before code exists
- **Plans that are executable**, not inspirational
- **TDD-first** pressure and anti-pattern avoidance
- **Structured debugging** instead of random edits
- **Review rituals** (spec compliance first, then code quality)

### ⚙️ Agent workflow upgrades
- Skills **trigger at the right time**, automatically
- “Stop and think” becomes the default behavior
- Subagent-driven execution scales work safely

---

## 🧰 Installation

> Installation differs by platform. Claude Code or Cursor have plugin marketplaces. Codex and OpenCode require manual setup.

### 🟧 Claude Code — Official Marketplace (recommended)

Superpowers is available via the official Claude plugin marketplace:  
https://claude.com/plugins/superpowers

```bash
/plugin install superpowers@claude-plugins-official
```

### 🟨 Claude Code — via Marketplace Repo

Register marketplace:

```bash
/plugin marketplace add obra/superpowers-marketplace
```

Install:

```bash
/plugin install superpowers@superpowers-marketplace
```

### 🟦 Cursor — Plugin Marketplace

In Cursor Agent chat:

```text
/add-plugin superpowers
```

Or search for **superpowers** in the plugin marketplace.

### 🟥 Codex

Tell Codex:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.codex/INSTALL.md
```

**Detailed docs:** [docs/README.codex.md](docs/README.codex.md)

### 🟩 OpenCode

Tell OpenCode:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.opencode/INSTALL.md
```

**Detailed docs:** [docs/README.opencode.md](docs/README.opencode.md)

### 🟪 Gemini CLI

```bash
gemini extensions install https://github.com/obra/superpowers
```

Update:

```bash
gemini extensions update superpowers
```

---

## 🔥 Quick start (2 minutes)

1. Install Superpowers in your agent platform.
2. Start a new session in a repo.
3. Ask for something real, e.g.:

- “Help me plan a new feature: ___”
- “Debug this failing test: ___”
- “Create an implementation plan for ___”

### ✅ Verify it’s working
You should see the agent **switch modes**: questions first → spec → plan → execution with verification.

---

## 🧩 The core workflow skills

These tend to form the “backbone” of a full shipping run:

1. **brainstorming** — Clarify goals, ask questions, explore options, write a digestible spec  
2. **using-git-worktrees** — Isolated branch/workspace, clean baseline checks  
3. **writing-plans** — 2–5 minute tasks, exact paths, verification steps  
4. **subagent-driven-development** / **executing-plans** — Execute tasks with checkpoints and reviews  
5. **test-driven-development** — RED → GREEN → REFACTOR, avoid untested “done”  
6. **requesting-code-review** / **receiving-code-review** — Review is mandatory and structured  
7. **finishing-a-development-branch** — Ensure tests pass, branch is clean, decide merge/PR

> **Important:** The agent checks for relevant skills *before* starting work. These are workflows, not suggestions.

---

## 📦 What’s inside this repo

- `skills/` — the skills library (the heart of Superpowers)
- `agents/`, `commands/`, `hooks/` — integrations and supporting tools
- `docs/` — platform-specific guides and usage docs
- `tests/` — automation to verify skills load and behave correctly

---

## 🧭 Philosophy (what this optimizes for)

- **Evidence over claims** — prove it works before calling it done  
- **Systematic over ad-hoc** — process beats guessing  
- **Complexity reduction** — keep solutions simple  
- **TDD when it matters** — confidence is a feature

Read more: https://blog.fsck.com/2025/10/09/superpowers/

---

## 🤝 Contributing

New skills and improvements are welcome.

**How to contribute:**
1. Fork the repository
2. Create a branch for your change
3. Follow the `writing-skills` skill to create and test new skills
4. Submit a PR

See: `skills/writing-skills/SKILL.md`

---

## 💖 Sponsorship

If Superpowers helped you do work that makes money and you’re so inclined, consider sponsoring:

https://github.com/sponsors/obra

---

## 📜 License

MIT — see `LICENSE`

---

## 🧷 Support & links

- Issues: https://github.com/obra/superpowers/issues  
- Marketplace: https://github.com/obra/superpowers-marketplace
