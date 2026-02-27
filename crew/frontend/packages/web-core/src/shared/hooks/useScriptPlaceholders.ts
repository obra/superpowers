import { useUserSystem } from '@/shared/hooks/useUserSystem';
import {
  createScriptPlaceholderStrategy,
  ScriptPlaceholderContext,
  type ScriptPlaceholders,
} from '@/shared/lib/scriptPlaceholders';

export function useScriptPlaceholders(): ScriptPlaceholders {
  const { system } = useUserSystem();

  if (system.environment) {
    return new ScriptPlaceholderContext(
      createScriptPlaceholderStrategy(system.environment.os_type)
    ).getPlaceholders();
  }

  return {
    setup: '#!/bin/bash\nnpm install\n# Add any setup commands here...',
    dev: '#!/bin/bash\nnpm run dev\n# Add dev server start command here...',
    cleanup:
      '#!/bin/bash\n# Add cleanup commands here...\n# This runs after coding agent execution',
    archive:
      '#!/bin/bash\n# Add archive commands here...\n# This runs when the workspace is archived',
  };
}
