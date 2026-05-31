# Runtime Guidance Contract

Runtime-specific files and metadata are adapters. Examples include Codex `agents/openai.yaml`, Claude `CLAUDE.md`, gstack guidance, and future runtime-specific metadata.

Adapters may translate, summarize, or route workflow instructions for a runtime. They must not:

- claim authority over `itradeaims-agent-workflows`
- invert the priority of repo `AGENTS.md`
- make third-party skills top-level iTradeAIMS workflow authority
- bypass iTradeAIMS gates
- weaken validation evidence requirements
- imply product repo compliance from personal/global installation

If a runtime cannot enforce a rule directly, its guidance must point back to the controller-approved source rather than inventing a weaker local rule.
