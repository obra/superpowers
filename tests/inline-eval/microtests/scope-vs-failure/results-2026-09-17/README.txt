Micro-test per writing-skills: one fresh-context codex exec per rep,
gpt-5.6-sol, reasoning effort low, repo with wordstat Tasks 1-2 done,
task = implement Task 3 (the CLI). Question: does the executing-plans
wording narrow the implementer's failure handling below its default?

arm                      except clause           n
control (no skill)       except OSError          6/6
v0 current v3 wording    except OSError          6/6
v1 scope-vs-failure      except OSError          6/6
v2 deletion-only         except OSError          6/6

Zero separation, zero variance, and the control is already narrow. No
rep in any arm wrote a decode test or discussed undecodable input.
Reads:
1. The claim from the interrogation ("the brief's narrow scope and the
   skill's instruction shaped that choice") is a plausible story the
   session told, not a cause this test can find. Wording is not the lever
   here.
2. v1's explicit positive principle (you own behavior for inputs the
   brief does not name) changed nothing at low effort. A principle stated
   in prose did not move a single rep.
3. The full bare Codex sessions (cxbare 21-23, 41-43) wrote
   (OSError, UnicodeError) 6/6 in a different frame: TUI session, whole
   plan in one go, its own Tasks 1-2. Whatever drives the defensive
   idiom lives in that frame (exec-mode vs TUI system prompt, whole-plan
   vs single-task prompt, own vs foreign prior code), not in the skill.
Consequence: prefer structural mechanisms with evidence (a Review Focus
list of implied cases, which moved Sonnet 4.5 implementers 3/3 under SDD;
a reviewer slot for declined scope) over re-wording the executor.
