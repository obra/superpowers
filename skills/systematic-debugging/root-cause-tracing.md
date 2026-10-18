# Root Cause Tracing

Fix a bad value where it was born, not where the error appears. Walk up the call chain one caller at a time, noting the value at each level.

Example: `git init` ran in the source tree because `cwd` was `''`. The empty value came from a test that read `context.tempDir` at module load, before `beforeEach` set it. The fix made `tempDir` a getter that throws if read before setup.

When reading is not enough, log just before the suspect operation. Use `console.error` in tests, where loggers are often silenced:

```typescript
console.error('DEBUG git init', { directory, cwd: process.cwd(), stack: new Error().stack });
```

To find which test leaves a file behind, run `find-polluter.sh` from this directory. It stops at the first test file that creates the path:

```bash
./find-polluter.sh '.git' 'src/**/*.test.ts'
```
