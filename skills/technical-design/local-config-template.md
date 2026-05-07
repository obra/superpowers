# Technical Design Local Config Template

Default config path: `~/.config/technical-design/config.md`

Agents should create this file on first use, or use `$TECHNICAL_DESIGN_CONFIG` if set. Prefer storing credential references (CLI profile names, environment variable names, keychain item names) instead of raw secrets. Store raw tokens only when the user explicitly asks and understands the risk.

## User Defaults

- Preferred doc platform: Lark / Confluence / other
- Default TD save location:
- Default Edit Log location convention: child page / sibling page / section in TD
- Default language: Chinese / English / bilingual

## Lark / Feishu

- Enabled: yes / no
- Auth method: `lark-cli` profile / env vars / browser session / other
- Auth reference:
- Default parent folder/wiki/page:
- Comment support: available / unavailable / unknown

## Confluence

- Enabled: yes / no
- Base URL:
- Space key:
- Default parent page:
- Auth method: API token / OAuth / browser session / other
- Auth reference:
- Comment support: available / unavailable / unknown

## Runtime Notes

- Last verified:
- Known limitations:
- Do not store:
