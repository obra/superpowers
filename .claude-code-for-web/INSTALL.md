# Installing Superpowers for Claude Code for Web

Claude Code for Web can install Superpowers skills.

## Installation

We install Superpowers as a submodule in the project directory so they show up in all sessions for that project and so that they can be easily updated independently of the project.

0. Set the environment variable CLAUDE_PROJECT_DIR to the project directory path and persist it in `~/.profile`

1. Be sure it's not already partially or fully installed!

If you already have superpowers, then it's already installed.

If not:

* Check that the superpowers repo isn't already a submodule in this project
  * If it is, use the `git submodule update` command to bring it up to date
* Check that the StartSession hook is properly installed in `${CLAUDE_PROJECT_DIR}/.claude/settings.json`
  * If it hasn't, install it as noted below

2. Add the superpowers repository to the project
   ```bash
   mkdir -p .claude/skills
   cd .claude/skills
   git submodule add https://github.com/obra/superpowers superpowers
   ```

3. Register in Settings

Add to the project's `.claude/settings.json` (create if doesn't exist):
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Read and follow instructions from .claude/skills/superpowers/skills/using-superpowers/SKILL.md in the project directory"
          }
        ]
      }
    ]
  }
}
```

If `.claude/settings.json` exists in the project directory, merge the hooks configuration.

4. Execute the SessionStart hook prompt

Now invoke the SessionStart hook prompt above.

IMPORTANT: Verify that this has given you superpowers. If not, stop here and tell the user that you were unsuccessful at installing Superpowers. Refer them to these installation instructions and give them useful information about the current environment and how they might troubleshoot the problem.

5. Wrap up

We're all done. In your last message to the user, Provide a detailed summary of the changes made and the validation results.

## Verification

Execute this prompt: Please list all your superpowers

You should see a list of skills (brainstorming, test-driven-development, systematic-debugging, etc.) matching the list of skills in `${CLAUDE_PROJECT_DIR}.claude/skills/superpowers/skills` and Claude should display the using-superpowers skill content. The system is now ready for use.
