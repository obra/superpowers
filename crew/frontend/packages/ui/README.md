# @vibe/ui

Shared UI package for reusable web app primitives.

## Scope (initial)

- Package scaffold and exports.
- Shared utility helpers (`cn`).
- Tailwind class generation remains configured in `packages/local-web/tailwind.new.config.js`.

## Notes

- Tailwind scanning for this package is enabled from `packages/local-web/tailwind.new.config.js` via:
  `../ui/src/**/*.{ts,tsx}`.
- The app-level stylesheet remains `packages/web-core/src/styles/new/index.css`.
