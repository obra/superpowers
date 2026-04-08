/**
 * Type declarations for OpenClaw Plugin SDK
 * These types are sufficient for our plugin's needs
 */

declare module "openclaw/plugin-sdk/plugin-entry" {
  export function definePluginEntry(opts: {
    id: string;
    name: string;
    description: string;
    kind?: string;
    configSchema?: any;
    register(api: import("./index").OpenClawPluginApi): void;
  }): any;
}

export interface OpenClawPluginApi {
  id: string;
  name: string;
  version?: string;
  description?: string;
  source: string;
  rootDir?: string;
  config: any;
  pluginConfig: Record<string, unknown>;
  runtime: PluginRuntime;
  logger: PluginLogger;
  registrationMode: "full" | "setup-only" | "setup-runtime";
  resolvePath(input: string): string;

  // Registration methods
  registerTool(tool: ToolDefinition, opts?: { optional?: true }): void;
  registerCommand(def: CommandDefinition): void;
  registerHook(events: string[], handler: Function, opts?: any): void;
  registerHttpRoute(params: any): void;
  registerGatewayMethod(name: string, handler: Function): void;
  registerCli(registrar: any, opts?: any): void;
  registerService(service: any): void;
  registerInteractiveHandler(registration: any): void;

  // Lifecycle
  on(hookName: string, handler: Function, opts?: any): void;
  onConversationBindingResolved(handler: Function): void;
}

export interface PluginRuntime {
  agent: AgentRuntime;
  subagent: SubagentRuntime;
  tts: TtsRuntime;
  mediaUnderstanding: MediaUnderstandingRuntime;
  imageGeneration: ImageGenerationRuntime;
  webSearch: WebSearchRuntime;
  media: MediaRuntime;
  config: ConfigRuntime;
  system: SystemRuntime;
  events: EventsRuntime;
  logging: LoggingRuntime;
  modelAuth: ModelAuthRuntime;
  state: StateRuntime;
  tools: ToolsRuntime;
  channel?: ChannelRuntime;
}

export interface AgentRuntime {
  resolveAgentDir(cfg: any): string;
  resolveAgentWorkspaceDir(cfg: any): string;
  resolveAgentIdentity(cfg: any): any;
  resolveThinkingDefault(cfg: any, provider: string, model: string): string;
  resolveAgentTimeoutMs(cfg: any): number;
  ensureAgentWorkspace(cfg: any): Promise<void>;
  runEmbeddedPiAgent(opts: any): Promise<any>;
  session: {
    resolveStorePath(cfg: any): string;
    loadSessionStore(cfg: any): any;
    saveSessionStore(cfg: any, store: any): Promise<void>;
    resolveSessionFilePath(cfg: any, sessionId: string): string;
  };
  defaults: {
    model: string;
    provider: string;
  };
}

export interface SubagentRuntime {
  run(opts: {
    sessionKey: string;
    message: string;
    provider?: string;
    model?: string;
    deliver?: boolean;
  }): Promise<{ runId: string }>;
  waitForRun(opts: { runId: string; timeoutMs: number }): Promise<any>;
  getSessionMessages(opts: { sessionKey: string; limit: number }): Promise<{ messages: any[] }>;
  deleteSession(opts: { sessionKey: string }): Promise<void>;
}

export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface AgentToolResult {
  content: Array<{ type: 'text'; text: string }>;
  details: unknown;
}

export interface ToolDefinition {
  name: string;
  label: string;
  description: string;
  parameters: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
  execute?: (_id: string, input: any) => AgentToolResult | Promise<AgentToolResult>;
}

export interface CommandDefinition {
  name: string;
  description?: string;
  handler?: (args: any) => any | Promise<any>;
}

// Other runtime interfaces (simplified for our usage)
export interface TtsRuntime {
  textToSpeech(opts: { text: string; cfg: any }): Promise<{ audio: Buffer; sampleRate: number }>;
  textToSpeechTelephony(opts: { text: string; cfg: any }): Promise<{ audio: Buffer; sampleRate: number }>;
  listVoices(opts: { provider: string; cfg: any }): Promise<any[]>;
}

export interface MediaUnderstandingRuntime {
  describeImageFile(opts: { filePath: string; cfg: any; agentDir: string }): Promise<any>;
  transcribeAudioFile(opts: { filePath: string; cfg: any; mime?: string }): Promise<{ text?: string }>;
  describeVideoFile(opts: { filePath: string; cfg: any }): Promise<any>;
  runFile(opts: { filePath: string; cfg: any }): Promise<any>;
}

export interface ImageGenerationRuntime {
  generate(opts: { prompt: string; cfg: any }): Promise<any>;
  listProviders(opts: { cfg: any }): any[];
}

export interface WebSearchRuntime {
  search(opts: { config: any; args: { query: string; count?: number } }): Promise<any>;
  listProviders(opts: { config: any }): any[];
}

export interface MediaRuntime {
  loadWebMedia(url: string): Promise<any>;
  detectMime(buffer: Buffer): Promise<string>;
  mediaKindFromMime(mime: string): string;
  isVoiceCompatibleAudio(filePath: string): boolean;
  getImageMetadata(filePath: string): Promise<any>;
  resizeToJpeg(buffer: Buffer, opts: { maxWidth: number }): Promise<Buffer>;
}

export interface ConfigRuntime {
  loadConfig(): Promise<any>;
  writeConfigFile(cfg: any): Promise<void>;
}

export interface SystemRuntime {
  enqueueSystemEvent(event: any): Promise<void>;
  requestHeartbeatNow(): void;
  runCommandWithTimeout(cmd: string, args: string[], opts: any): Promise<any>;
  formatNativeDependencyHint(pkg: string): string;
}

export interface EventsRuntime {
  onAgentEvent(handler: (event: any) => void): void;
  onSessionTranscriptUpdate(handler: (update: any) => void): void;
}

export interface LoggingRuntime {
  shouldLogVerbose(): boolean;
  getChildLogger(context: any, opts: { level?: string }): PluginLogger;
}

export interface ModelAuthRuntime {
  getApiKeyForModel(opts: { model: string; cfg: any }): Promise<string | null>;
  resolveApiKeyForProvider(opts: { provider: string; cfg: any }): Promise<any>;
}

export interface StateRuntime {
  resolveStateDir(): string;
}

export interface ToolsRuntime {
  createMemoryGetTool(opts: any): any;
  createMemorySearchTool(opts: any): any;
  registerMemoryCli(opts: any): void;
}

export interface ChannelRuntime {
  // Channel-specific runtime helpers
}

export function definePluginEntry(opts: {
  id: string;
  name: string;
  description: string;
  kind?: string;
  configSchema?: any;
  register(api: OpenClawPluginApi): void;
}): any;
