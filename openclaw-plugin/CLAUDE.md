# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@weiping/openclaw-superpowers** is an OpenClaw plugin that ports 14 workflow skills from [pi-superpowers](https://github.com/weiping/pi-superpowers) to the OpenClaw AI agent platform. The plugin registers agent tools (`dispatch_agent`, `TodoWrite`) that skills can directly reference, and provides Chinese trigger keywords for all skills.

## Architecture

```
openclaw-plugin/
├── index.ts              # Plugin entry point using definePluginEntry()
├── index.d.ts            # TypeScript type exports (ToolDefinition, PluginApi, etc.)
├── openclaw-sdk.d.ts     # Minimal type declarations for OpenClaw Plugin SDK
├── tsconfig.json         # Path mapping: openclaw/plugin-sdk/plugin-entry → ./openclaw-sdk.d.ts
├── scripts/
│   └── copy-skills.mjs   # Copies skills from parent ../skills directory
└── skills/               # Generated during build, not committed
    ├── brainstorming/SKILL.md
    ├── writing-plans/SKILL.md
    └── ... (14 skills total)
```

**Key Design Decision**: This plugin has `openclaw` as a `peerDependency`, not a direct dependency. The `tsconfig.json` path mapping redirects `openclaw/plugin-sdk/plugin-entry` imports to local type declarations (`openclaw-sdk.d.ts`) so TypeScript can compile without the actual OpenClaw package installed. At runtime, OpenClaw provides the real module.

## Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run prepublishOnly # Copy skills from ../skills + build
npm publish           # Publish to npm (runs prepublishOnly automatically)
```

To test locally with OpenClaw:
```bash
# Install from local tarball
npm pack
npx openclaw plugins install ./weiping-openclaw-superpowers-*.tgz
npx openclaw gateway restart
npx openclaw doctor  # Verify plugin loads without errors
```

## Critical: OpenClaw Tool API Format

**The plugin uses OpenClaw's specific tool API format, NOT the formats used by Claude Code or other platforms.**

When registering tools in `index.ts`, use this format:

```typescript
api.registerTool({
  name: "my_tool",
  label: "My Tool",              // REQUIRED: display name
  description: "Tool description",
  parameters: {                   // NOT "inputSchema"
    type: "object",
    additionalProperties: false,  // Recommended
    required: ["prompt"],
    properties: {
      prompt: { type: "string" }
    }
  },
  async execute(_id: string, input: any) {  // NOT "handler(input)"
    return {
      content: [{                 // REQUIRED format
        type: "text",
        text: "result"
      }],
      details: {}                 // Optional metadata
    };
  }
});
```

**Common Errors:**
- Using `inputSchema` instead of `parameters` → `Cannot read properties of undefined (reading 'properties')`
- Using `handler(input)` instead of `execute(_id, input)` → Runtime failure
- Missing `label` field → Tool not registered properly
- Returning plain object instead of `{ content: [...], details: ... }` → Response not parsed

See `OpenClaw Plugin SDK Reference.md` Chapter 8 for detailed troubleshooting.

## Skills Source

Skills are copied from the parent `pi-superpowers` repository (`../skills/`) during `prepublishOnly`. The copy script excludes:
- `render-graphs.js` (Node-only graph generation)
- `diagrams/` directory (Graphviz .dot files)

**When modifying skills**: Edit files in `/Users/liuweiping/repos/pi-superpowers/skills/`, then run `npm run prepublishOnly` in this plugin to sync changes.

## Type Declarations

- `index.d.ts` - Re-exports `ToolDefinition`, `PluginApi`, runtime interfaces
- `openclaw-sdk.d.ts` - Declares `openclaw/plugin-sdk/plugin-entry` module with `definePluginEntry`

The `tsconfig.json` path mapping ensures TypeScript resolves `openclaw/plugin-sdk/plugin-entry` to `openclaw-sdk.d.ts`:
```json
{
  "compilerOptions": {
    "paths": {
      "openclaw/plugin-sdk/plugin-entry": ["./openclaw-sdk.d.ts"]
    }
  }
}
```

## Plugin Manifest

`openclaw.plugin.json` declares this as a minimal plugin with no config schema:
```json
{
  "id": "openclaw-superpowers",
  "name": "Superpowers",
  "configSchema": { "type": "object", "additionalProperties": false }
}
```

If you need to add plugin configuration, update this file and the `configSchema` in `index.ts`.

## Registered Tools

The plugin registers these tools that skills can invoke:

1. **`dispatch_agent`** - Spawns a subagent for parallel independent tasks
   - Uses `api.runtime.subagent.run()` and `waitForRun()`

2. **`TodoWrite`** - Guidance tool for TODO.md management
   - Returns instructions to use write/edit tools directly
   - No actual file I/O (OpenClaw provides those tools)

## Development Workflow

1. Edit code in `index.ts` or `index.d.ts`
2. Run `npm run build` to compile
3. For skill changes: edit in `../skills/` then `npm run prepublishOnly`
4. Test locally (see Commands above)
5. Update `package.json` version
6. `npm publish`

## Related Documentation

- `OpenClaw Plugin SDK Reference.md` - Comprehensive SDK documentation (1966 lines)
- [OpenClaw Official Docs](https://docs.openclaw.ai/plugins/sdk-overview)
