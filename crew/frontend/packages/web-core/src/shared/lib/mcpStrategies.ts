import type { McpConfig, JsonValue } from 'shared/types';

type JsonObject = Record<string, JsonValue>;

function isJsonObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export class McpConfigStrategyGeneral {
  static createFullConfig(cfg: McpConfig): JsonObject {
    const cloned: JsonValue = JSON.parse(JSON.stringify(cfg.template ?? {}));
    const fullConfig: JsonObject = isJsonObject(cloned) ? cloned : {};
    let current: JsonObject = fullConfig;

    for (let i = 0; i < cfg.servers_path.length - 1; i++) {
      const key = cfg.servers_path[i];
      const next = isJsonObject(current[key])
        ? (current[key] as JsonObject)
        : undefined;
      if (!next) current[key] = {};
      current = current[key] as JsonObject;
    }

    if (cfg.servers_path.length > 0) {
      const lastKey = cfg.servers_path[cfg.servers_path.length - 1];
      current[lastKey] = cfg.servers;
    }
    return fullConfig;
  }
  static validateFullConfig(
    mcp_config: McpConfig,
    full_config: JsonValue
  ): void {
    let current: JsonValue = full_config;
    for (const key of mcp_config.servers_path) {
      if (!isJsonObject(current)) {
        throw new Error(
          `Expected object at path: ${mcp_config.servers_path.join('.')}`
        );
      }
      current = current[key];
      if (current === undefined) {
        throw new Error(
          `Missing required field at path: ${mcp_config.servers_path.join('.')}`
        );
      }
    }
    if (!isJsonObject(current)) {
      throw new Error('Servers configuration must be an object');
    }
  }
  static extractServersForApi(
    mcp_config: McpConfig,
    full_config: JsonValue
  ): JsonObject {
    let current: JsonValue = full_config;
    for (const key of mcp_config.servers_path) {
      if (!isJsonObject(current)) {
        throw new Error(
          `Expected object at path: ${mcp_config.servers_path.join('.')}`
        );
      }
      current = current[key];
      if (current === undefined) {
        throw new Error(
          `Missing required field at path: ${mcp_config.servers_path.join('.')}`
        );
      }
    }
    if (!isJsonObject(current)) {
      throw new Error('Servers configuration must be an object');
    }
    return current;
  }

  static addPreconfiguredToConfig(
    mcp_config: McpConfig,
    existingConfig: JsonValue,
    serverKey: string
  ): JsonObject {
    const preconfVal = mcp_config.preconfigured;
    if (!isJsonObject(preconfVal) || !(serverKey in preconfVal)) {
      throw new Error(`Unknown preconfigured server '${serverKey}'`);
    }

    const updatedVal: JsonValue = JSON.parse(
      JSON.stringify(existingConfig ?? {})
    );
    const updated: JsonObject = isJsonObject(updatedVal) ? updatedVal : {};
    let current: JsonObject = updated;

    for (let i = 0; i < mcp_config.servers_path.length - 1; i++) {
      const key = mcp_config.servers_path[i];
      const next = isJsonObject(current[key])
        ? (current[key] as JsonObject)
        : undefined;
      if (!next) current[key] = {};
      current = current[key] as JsonObject;
    }

    if (mcp_config.servers_path.length === 0) {
      current[serverKey] = preconfVal[serverKey];
      return updated;
    }

    const lastKey = mcp_config.servers_path[mcp_config.servers_path.length - 1];
    if (!isJsonObject(current[lastKey])) current[lastKey] = {};
    (current[lastKey] as JsonObject)[serverKey] = preconfVal[serverKey];

    return updated;
  }
}
