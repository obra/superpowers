// Root entrypoint for OpenCode v2 directory-form plugin registration.
//
// v2 hosts (>= beta-18743) require config plugin entries to be directories
// with an index entrypoint (`index.js`) and reject bare file paths
// ("configured plugin path must be a directory"). npm/git package installs
// resolve via package.json `main`; this file only serves the directory form
// (e.g. `"plugin": ["~/superpowers"]` or a `node_modules/superpowers` path).
export { default } from "./.opencode/plugins/superpowers.js";
