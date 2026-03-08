# Installing Superpowers in Gemini CLI

Superpowers skills are fully compatible with Gemini CLI's Agent Skills standard. You can install individual skills or link the entire repository to your local environment.

## Installation via Gemini CLI

### 1. Linking Local Skills (Recommended for Development)
If you have cloned this repository locally, you can link specific skills so updates are reflected immediately:

```bash
gemini skills link <path_to_superpowers>/skills/brainstorming/
```

### 2. Remote Installation from GitHub
Install directly into your user or workspace scope from this fork:

```bash
gemini skills install https://github.com/samuelfa/superpowers.git --path skills/brainstorming
```

## Verify Installation
Start an interactive session and list your active skills:

```bash
/skills list
```

You should see `brainstorming` (and any other linked skills) as enabled. To trigger it, simply ask for help planning a feature or building a new component.
