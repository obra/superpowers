# Installing Superpowers for Factory Droid CLI

Enable superpowers skills in Droid CLI via the native plugin system. Just add the marketplace and install.

## Prerequisites

- Factory Droid CLI installed
- Git

## Installation

1. **Add the superpowers marketplace:**
   ```bash
   droid plugin marketplace add https://github.com/obra/superpowers
   ```

2. **Install the plugin:**
   ```bash
   droid plugin install superpowers@superpowers
   ```

   Or use the interactive UI:
   ```
   /plugins
   ```
   Navigate to Browse tab, find superpowers, and install.

3. **Restart Droid CLI** (quit and relaunch) to discover the skills.

## Verify

```bash
droid plugin list
```

You should see `superpowers@superpowers` listed.

## Updating

```bash
droid plugin update superpowers@superpowers
```

Or via the interactive UI: `/plugins` → Installed tab → select superpowers → Update.

## Uninstalling

```bash
droid plugin uninstall superpowers@superpowers
```
