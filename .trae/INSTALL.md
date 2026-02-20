# Installing Superpowers for TRAE

Enable superpowers skills in TRAE via skill discovery:

- Global skills: `~/.trae/skills`
- Project skills: `.trae/skills` within your project

Install by cloning the repo and linking skills using the hub-pattern installer.

## Prerequisites

- Git

## Installation

1. **Clone the superpowers repository:**

   ```bash
   git clone https://github.com/obra/superpowers.git ~/.trae/superpowers
   ```

2. **Install (link) skills:**

   ```bash
   bash ~/.trae/superpowers/scripts/install-trae.sh
   ```

   **If you want project-local skills instead:**

   ```bash
   cd /path/to/your/project
   bash ~/.trae/superpowers/scripts/install-trae.sh --project
   ```

3. **Restart TRAE** to refresh skill discovery.

## Verify

After restart, ask TRAE to load or use a skill (for example: "use using-superpowers" or "use brainstorming").

## Updating

```bash
cd ~/.trae/superpowers && git pull
bash ~/.trae/superpowers/scripts/install-trae.sh
```

## Uninstalling

Remove only the symlinks created by the installer:

```bash
find ~/.trae/skills -maxdepth 1 -type l -delete
```

Optionally delete the clone: `rm -rf ~/.trae/superpowers`.
