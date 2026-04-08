/**
 * OpenClaw Plugin SDK Type Declarations
 * Minimal types needed for the plugin to compile
 */

import { OpenClawPluginApi } from "./index";

export function definePluginEntry(opts: {
  id: string;
  name: string;
  description: string;
  kind?: string;
  configSchema?: any;
  register(api: OpenClawPluginApi): void;
}): any;
