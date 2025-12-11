# Installing Superpowers for Claude Code for Web

Claude Code for Web can install Superpowers skills locally to its user home directory, making them available across all projects and sessions.

## Installation

0. Be sure it's not already partially or fully installed!

If you already have superpowers, then it's already installed. If not:

* Check that the superpowers repo hasn't already been cloned
  * If it has been, use the `git` command to bring it up to date
* Check that the StartSession hook is properly installed in `.claude/settings.json`
  * If it hasn't, install it as noted below

1. Clone superpowers repository
   ```bash
   mkdir -p .claude/skills/superpowers
   cd .claude/skills/superpowers
   git clone https://github.com/obra/superpowers.git .
   ```

2. Register in Settings

Add to `.claude/settings.json` (create if doesn't exist):
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Read and follow instructions from .claude/skills/superpowers/skills/using-superpowers/SKILL.md"
          }
        ]
      }
    ]
  }
}
```

If `.claude/settings.json` exists, merge the hooks configuration.

3. Execute the SessionStart hook prompt

Now invoke the SessionStart hook prompt above.

IMPORTANT: Verify that this has given you superpowers. If not, stop here and tell the user that you were unsuccessful at installing Superpowers. Refer them to these installation instructions and give them useful information about the current environment and how they might troubleshoot the problem.

4. Wrap up

We're all done. In your last message to the user, Provide a detailed summary of the changes made and the validation results.

## Verification

Execute this prompt: Please list all your superpowers

You should see a list of skills (brainstorming, test-driven-development, systematic-debugging, etc.) matching the list of skills in `.claude/skills/superpowers/skills` and Claude should display the using-superpowers skill content. The system is now ready for use.
