# Brainstorm Server Tests

These tests validate the local Horspowers visual companion server under
`skills/brainstorming/scripts/`.

## Prerequisites

- `node`
- `npm`

## Recommended Command

```bash
bash ./run-tests.sh
```

This runner:

1. Ensures `node` and `npm` exist
2. Installs `ws` via `npm ci` when dependencies are missing
3. Runs the Node-side server and WebSocket protocol tests
4. Runs the Windows lifecycle script

## Direct Commands

### Node-side tests only

```bash
npm test
```

This covers:

- `server.test.js`
- `ws-protocol.test.js`

### Lifecycle test only

```bash
bash ./windows-lifecycle.test.sh
```

On non-Windows platforms it will partially skip Windows-specific assertions but
still validate general lifecycle behavior such as startup, liveness, HTTP
availability, and shutdown.
