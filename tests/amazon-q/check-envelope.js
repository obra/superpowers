let raw = "";
process.stdin.on("data", c => (raw += c));
process.stdin.on("end", () => {
  const d = JSON.parse(raw);
  if (process.env.WANT === "claude") {
    process.exit(d.hookSpecificOutput && d.hookSpecificOutput.additionalContext ? 0 : 1);
  } else if (process.env.WANT === "cursor") {
    process.exit(d.additional_context ? 0 : 1);
  }
  process.exit(1);
});
