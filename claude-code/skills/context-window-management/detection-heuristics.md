# How to Detect 160k Tokens

Agents cannot directly query their token count. Use these heuristics:

**Estimate your token usage by tracking conversation length:**
- ~4 characters = ~1 token (English), ~2 characters = ~1 token (code-heavy)
- A typical tool call + response = 500-2,000 tokens
- Reading a 200-line file = ~3,000-5,000 tokens
- Each agent turn (thinking + output) = ~1,000-3,000 tokens

**Watch for these system signals that you are approaching the limit:**
- System compresses prior messages automatically (you'll see summarized earlier context)
- Responses start losing track of earlier instructions
- You've had 40+ back-and-forth turns in a conversation
- You've read 15+ files or made 30+ tool calls

**Rule of thumb:** If you've been working for 30+ turns OR the system has auto-compressed once, assume you're at or near 160k and trigger compression.
