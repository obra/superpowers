# Installing Superpowers for Qoder

Enable superpowers skills in Qoder IDE or Qoder CLI. Choose between Skills CLI (recommended) or manual setup.

## Prerequisites

- [Qoder IDE](https://qoder.com/download) or Qoder CLI
- Git (for manual installation)

## Quick Install (Skills CLI)

Run in Qoder IDE terminal:

```bash
npx skills add https://github.com/obra/superpowers -a qoder
```

Restart Qoder. That's it — all skills are installed and discoverable.

## Manual Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.qoder/superpowers
   ```

2. **Link skills into the Qoder skills directory:**
   ```bash
   mkdir -p ~/.qoder/skills
   ln -s ~/.qoder/superpowers/skills/* ~/.qoder/skills/
   ```

3. **Restart Qoder** to discover the skills.

## Verify

Type `/` in the Qoder chat dialog to view the loaded skills list. You should see superpowers skills available.

Alternatively, verify the files exist:

```bash
ls ~/.qoder/skills/
```

## Updating

### Skills CLI

```bash
npx skills add https://github.com/obra/superpowers -a qoder
```

### Manual

```bash
cd ~/.qoder/superpowers && git pull
```

Skills update instantly through the symlinks.

## Uninstalling

```bash
# Remove skill symlinks
find ~/.qoder/skills -maxdepth 1 -type l -delete
```

Optionally delete the clone: `rm -rf ~/.qoder/superpowers`.
