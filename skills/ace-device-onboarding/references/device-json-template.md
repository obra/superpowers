# Device Definition — Current Single-Backend Pattern

`device.json` declares one concrete leaf device and its one backend:

```json
{
  "name": "<device-family>/<implementation>",
  "type": "<DEVICE_TYPE>",
  "type_ref": "<device-family>",
  "vendor": "<Vendor Name>",
  "model": "<Model Name>",
  "version": "1.0.0",
  "description": "Brief description of the concrete device",
  "capabilities": [],
  "parameters": {},
  "has_simulator": false,
  "device_backend": {
    "source": "local",
    "config": {}
  },
  "metadata": {
    "sdk_install": {
      "method": "pip",
      "package": "git+ssh://git@github.com/org/sdk.git@<commit>",
      "import_name": ["sdk_top_level_module"]
    }
  }
}
```

For a project-local SDK, use a portable environment-based path:

```json
"sdk_install": {
  "method": "local",
  "package": "${ACE_PROJECT_ROOT}/path/to/sdk",
  "import_name": ["sdk_top_level_module"]
}
```

`type_ref` requires `devices/<device-family>/type.json`; omit `type_ref` only when
the leaf fully declares all capability schemas itself.

Key principles:

- A concrete device has exactly one `device_backend`.
- `has_simulator` describes whether this leaf is simulated; keep the safe template
  default `false` for physical devices and set it to `true` only for simulator leaves.
- Ordinary SDK operations live in `device.py`; `node.py` is optional custom logic.
- New definitions must use `metadata.sdk_install`.
- Do not generate legacy `simulator`, `simulator_id`, `metadata.sdk`, or
  `metadata.sdk_path` fields. The runtime reads them only for backward compatibility.
