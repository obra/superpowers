interface ScriptPlaceholders {
  setup: string;
  dev: string;
  cleanup: string;
  archive: string;
}

interface ScriptPlaceholderStrategy {
  getPlaceholders(): ScriptPlaceholders;
}

class WindowsScriptPlaceholderStrategy implements ScriptPlaceholderStrategy {
  getPlaceholders(): ScriptPlaceholders {
    return {
      setup: `@echo off
npm install
REM Add any setup commands here...`,
      dev: `@echo off
npm run dev
REM Add dev server start command here...`,
      cleanup: `@echo off
REM Add cleanup commands here...
REM This runs after coding agent execution - only if changes were made`,
      archive: `@echo off
REM Add archive commands here...
REM This runs when the workspace is archived`,
    };
  }
}

class UnixScriptPlaceholderStrategy implements ScriptPlaceholderStrategy {
  getPlaceholders(): ScriptPlaceholders {
    return {
      setup: `npm install
# Add any setup commands here...`,
      dev: `npm run dev
# Add dev server start command here...`,
      cleanup: `# Add cleanup commands here...
# This runs after coding agent execution - only if changes were made`,
      archive: `# Add archive commands here...
# This runs when the workspace is archived`,
    };
  }
}

class ScriptPlaceholderContext {
  private strategy: ScriptPlaceholderStrategy;

  constructor(strategy: ScriptPlaceholderStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ScriptPlaceholderStrategy): void {
    this.strategy = strategy;
  }

  getPlaceholders(): ScriptPlaceholders {
    return this.strategy.getPlaceholders();
  }
}

export function createScriptPlaceholderStrategy(
  osType: string
): ScriptPlaceholderStrategy {
  if (osType.toLowerCase().includes('windows')) {
    return new WindowsScriptPlaceholderStrategy();
  }
  return new UnixScriptPlaceholderStrategy();
}

export { ScriptPlaceholderContext, type ScriptPlaceholders };
