# Troubleshooting Superpowers for Gemini CLI

## Installation Issues

### "gemini extensions install" command fails

**Symptom:** Error when running installation command

**Solutions:**
1. Ensure Gemini CLI is installed:
   ```bash
   gemini --version
   ```

2. Ensure git is installed:
   ```bash
   git --version
   ```

3. Try installing from local path:
   ```bash
   git clone https://github.com/sh3lan93/superpowers.git /tmp/superpowers
   gemini extensions install /tmp/superpowers/.gemini-cli
   ```

---

## Skill Discovery Issues

### "gemini skills list" shows no Superpowers skills

**Symptoms:**
- `gemini skills list` is empty or missing Superpowers skills
- Skills were working but now they're gone

**Causes & Solutions:**

1. **Extension not installed**
   ```bash
   # Check
   ls ~/.gemini/extensions/superpowers/

   # Fix: Reinstall
   gemini extensions install https://github.com/sh3lan93/superpowers.git --path .gemini-cli
   ```

2. **Skills directory missing**
   ```bash
   # Check
   ls ~/.gemini/extensions/superpowers/skills/

   # Fix: Reinstall extension
   ```

3. **Gemini CLI cache needs refresh**
   ```bash
   gemini restart
   gemini skills list  # Should show skills now
   ```

4. **Extension disabled**
   ```bash
   gemini extensions list  # Check if superpowers is enabled
   ```

---

## Skill Activation Issues

### Skills don't activate automatically

**Symptom:** Asking for help doesn't trigger relevant skill

**Causes:**
1. Skill description doesn't match your question closely
2. Superpowers context (GEMINI.md) not loaded
3. Skill content not detailed enough

**Solutions:**

1. **Load skill manually:**
   ```bash
   gemini skills load systematic-debugging
   ```

2. **Ask more specifically:**
   ```
   Instead of: "I have a bug"
   Try: "How do I debug this null pointer exception?"
   ```

3. **Check context is loaded:**
   - Type: "What superpowers do I have?"
   - Should mention Superpowers and list skills

---

## Context & Hook Issues

### GEMINI.md context not appearing in sessions

**Symptom:** Superpowers guidance doesn't appear in conversations

**Checks:**
1. Verify extension installed:
   ```bash
   gemini extensions list | grep superpowers
   ```

2. Check GEMINI.md exists:
   ```bash
   cat ~/.gemini/extensions/superpowers/GEMINI.md
   ```

3. Verify contextFileName in manifest:
   ```bash
   cat ~/.gemini/extensions/superpowers/gemini-extension.json | grep contextFileName
   ```

4. Restart Gemini CLI:
   ```bash
   gemini restart
   ```

**If still missing:**
- Contact support with output from above commands

---

### Hooks not executing

**Symptom:** "Superpowers initialized" message doesn't appear at startup

**Checks:**
1. Verify hooks.json exists:
   ```bash
   cat ~/.gemini/extensions/superpowers/hooks.json
   ```

2. Check hook script exists:
   ```bash
   cat ~/.gemini/extensions/superpowers/hooks/session-start.js
   ```

3. Try running hook manually:
   ```bash
   node ~/.gemini/extensions/superpowers/hooks/session-start.js
   ```

4. Check Gemini CLI logs:
   ```bash
   tail -f ~/.gemini/logs/
   ```

---

## Tool Compatibility Issues

### "Tool not found" errors

**Symptom:** Skills reference tools that don't work in Gemini CLI

**Common Issues:**

1. **TodoWrite (plan tracking) not available**
   - Superpowers uses TodoWrite in Claude Code
   - Gemini CLI doesn't have equivalent
   - **Workaround:** Track plans in project `.md` files
   ```bash
   touch .gemini/plan.md
   # Update manually during implementation
   ```

2. **Grep not available**
   - Superpowers uses Grep for text search
   - Gemini CLI has `glob` but not `grep`
   - **Workaround:** Use shell commands
   ```bash
   # Instead of: grep "pattern" file
   # Use: run_shell_command("grep \"pattern\" file")
   ```

3. **Other tools not working**
   - **Workaround:** Use `run_shell_command` as fallback
   ```bash
   run_shell_command("ls -la src/")
   ```

---

## Performance Issues

### Extension loads slowly

**Symptoms:**
- Gemini CLI takes a long time to start
- Skills appear to load slowly

**Solutions:**
1. Large GEMINI.md consumes tokens
   - Current: ~2000 tokens
   - This is normal and expected

2. Many skills to discover
   - Current: 14 skills
   - This is normal and expected

---

## Custom Skill Issues

### Custom skill not discovered

**Symptom:** Created `.gemini/skills/my-skill/SKILL.md` but it doesn't show up

**Checks:**
1. Correct directory:
   ```bash
   ls -la .gemini/skills/my-skill/SKILL.md
   ```

2. Correct SKILL.md format:
   ```markdown
   ---
   name: my-skill
   description: Use when [condition]
   ---

   # My Skill
   Content...
   ```

3. Restart Gemini CLI:
   ```bash
   gemini restart
   gemini skills list  # Should show my-skill
   ```

---

## Version Issues

### Superpowers outdated

**Symptom:** You want the latest skills and fixes

**Solution:**
```bash
# Update the extension
gemini extensions update superpowers

# If that doesn't work, reinstall:
gemini extensions uninstall superpowers
gemini extensions install https://github.com/sh3lan93/superpowers.git --path .gemini-cli
```

---

## Getting Help

### Still having issues?

1. **Check documentation:**
   - Full docs: [../docs/README.gemini-cli.md](../docs/README.gemini-cli.md)
   - Examples: [EXAMPLES.md](EXAMPLES.md)
   - Superpowers repo: https://github.com/obra/superpowers

2. **File an issue:**
   - Include error messages
   - Include output from:
     ```bash
     gemini --version
     gemini extensions list
     gemini skills list
     ```

3. **Discussion:**
   - GitHub Discussions: https://github.com/obra/superpowers/discussions

## Debug Information to Collect

When reporting issues, provide:

```bash
# Gemini CLI version
gemini --version

# Extension installation
ls -la ~/.gemini/extensions/superpowers/

# Skill discovery
gemini skills list

# Hooks status
cat ~/.gemini/extensions/superpowers/hooks.json

# Recent logs (if available)
tail -50 ~/.gemini/logs/latest.log
```

---

## FAQ

**Q: Can I use Superpowers with other extensions?**
A: Yes! Skills are discovered from all extensions. Project skills can override.

**Q: Do I need to pay for Superpowers?**
A: No, Superpowers is open source and free.

**Q: Can I modify skills?**
A: Yes! Create project-specific skills in `.gemini/skills/` to override.

**Q: Does Superpowers work offline?**
A: Yes, once installed. Skills are local markdown files.

**Q: How do I contribute improvements?**
A: Follow the `writing-skills` skill methodology and submit a PR.

---

**Last Updated:** 2025-02-28
**Superpowers Version:** 4.3.1
