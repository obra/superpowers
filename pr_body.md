## Description
This Pull Request introduces three major quality-of-life and scalability enhancements to the Superpowers framework:

### 1. **Sentinel (Automated Progress Tracking)**
Addresses the lack of visibility during long-running plan executions. 
- Modified `executing-plans` skill to require an update to a root-level `PROGRESS.md` after each task completion.
- Provides a "live" log of what the agent is doing, including timestamps and evidence (commit hashes).
- See `PROGRESS.md` for the format.

### 2. **Dynamic Skill Discovery (Scale optimization)**
Optimizes performance when using extensive skill libraries (e.g., 900+ automated SaaS skills).
- Added a Node.js-based `generate_skills_index.js` script to create a lightweight `SKILLS_INDEX.md`.
- Updated `using-superpowers` skill to guide agents to lookup the index first, preventing context bloat and token waste.

### 3. **Windows & Cross-Platform Adaptability**
- Added a comprehensive command mapping table in `using-superpowers` (e.g., `ls` -> `dir`, `rm -rf` -> `rmdir /s /q`) to ensure agents behave correctly on Windows environments without WSL.

## Testing & Evidence
Tested locally on Windows:
- Verified `SKILLS_INDEX.md` generation correctly parses frontmatter names and descriptions.
- Verified manual command mapping using `findstr` as a substitute for `grep`.
- Verified `PROGRESS.md` updates correctly during the development of this feature.

---
*Created by Antigravity (Advanced Agentic Coding) in collaboration with @locfaker.*
