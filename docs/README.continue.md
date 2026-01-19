# Superpowers for Continue

Complete guide for using Superpowers with Continue.

## Quick Install

Tell Continue:

```
Fetch and follow instructions from https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.continue/INSTALL.md
```

## Manual Installation

### Prerequisites

- Continue installed
- Git installed

### Installation Steps

#### 1. Clone Superpowers

```bash
mkdir -p ~/.continue/superpowers
git clone https://github.com/obra/superpowers.git ~/.continue/superpowers
```

#### 2. Install Skills

```bash
mkdir -p ~/.continue/skills
rm -rf ~/.continue/skills/superpowers
ln -s ~/.continue/superpowers/skills ~/.continue/skills/superpowers
```

#### 3. Install Prompts

```bash
mkdir -p ~/.continue/prompts
for f in ~/.continue/superpowers/.continue/prompts/*.prompt; do
  ln -sf "$f" ~/.continue/prompts/$(basename "$f")
done
```

#### 4. Reload Config (optional)

Continue supports hot loading for skills and prompts. Changes should take effect immediately.

If you don’t see the new commands, use Continue’s `Reload Config`.

## Usage

In Continue, type `/` and run:

- `Superpowers: Bootstrap`
- `Superpowers: Brainstorm`
- `Superpowers: Write Plan`
- `Superpowers: Execute Plan`

## Verification

```bash
ls ~/.continue/prompts | grep '^superpowers-'
ls ~/.continue/skills/superpowers/brainstorming/SKILL.md
```

## Updating

```bash
cd ~/.continue/superpowers
git pull
```

