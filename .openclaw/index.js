const SUPERPOWERS_GUIDANCE = `## Superpowers

You have access to the Superpowers skill framework through OpenClaw's native skill system.
Before responding to software development work, check whether one of those skills applies.
If a Superpowers skill fits the task, invoke it before proceeding.

Start with \`using-superpowers\` when you need the overall workflow. Common follow-on
skills include \`brainstorming\`, \`writing-plans\`, \`test-driven-development\`,
\`systematic-debugging\`, \`dispatching-parallel-agents\`, and
\`verification-before-completion\`.

When Superpowers instructions mention generic tools, use the closest native OpenClaw
tool or workflow.`;

export default {
  id: "superpowers-openclaw",
  name: "Superpowers for OpenClaw",
  description: "Expose the Superpowers skill pack through OpenClaw's native plugin skill discovery.",

  register(api) {
    api.on("before_prompt_build", async () => ({ prependSystemContext: SUPERPOWERS_GUIDANCE }));
  },
};
