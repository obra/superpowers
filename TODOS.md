# FeatureForge TODOs

- Remove the remaining internal cutover-only compatibility hooks, especially any legacy session or env names that still survive in code or test scaffolding.
- Add the final end-to-end cutover gate that blocks new forbidden legacy names in active file contents and active path names while ignoring archived history.
- Expand install smoke coverage for checked-in prebuilt artifacts on macOS arm64 and `windows-x64`.
- Auto-bypass the runtime-owned session-entry gate for spawned subagents unless they are explicitly opted back into FeatureForge, so dispatched review and audit agents do not get the first-turn bootstrap prompt.
