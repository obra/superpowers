# Installing Superpowers in Gemini CLI

Superpowers skills are fully compatible with Gemini CLI's Agent Skills standard. You can install individual skills or link the entire repository to your local environment.

## Installation via Gemini CLI

### 1. Linking All Skills (Recommended for Local Use)
If you have cloned this repository locally, the fastest way to get started is by running the included installation script:

```bash
cd superpowers/
./scripts/gemini-install.sh
```

### 2. Linking Individual Local Skills
If you want to link specific skills so updates are reflected immediately:

```bash
gemini skills link <path_to_superpowers>/skills/brainstorming/
```

### 3. Remote Installation from GitHub
Install directly into your user or workspace scope from the official repository:

```bash
gemini skills install https://github.com/obra/superpowers.git --path skills/brainstorming
```

## Verify Installation
Start an interactive session and list your active skills:

```bash
/skills list
```

You should see all linked skills as enabled. To trigger them, simply start a conversation.
