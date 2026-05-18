import * as path from 'path';

// Redirect the global patterns wiki to the test tmp directory so integration
// tests do not pollute (or read from) the real ~/.superpowers/patterns-wiki.
process.env.SUPERPOWERS_PATTERNS_WIKI = path.join(__dirname, '..', 'tmp-integration-test');
