import { Code2 } from 'lucide-react';
import { EditorType } from 'shared/types';
import { useTheme, getResolvedTheme } from '@/shared/hooks/useTheme';
import { getIdeName } from '@/shared/lib/ideName';

type IdeIconProps = {
  editorType?: EditorType | null;
  className?: string;
};

export function IdeIcon({ editorType, className = 'h-4 w-4' }: IdeIconProps) {
  const { theme } = useTheme();
  const resolvedTheme = getResolvedTheme(theme);
  const isDark = resolvedTheme === 'dark';

  const ideName = getIdeName(editorType);
  let ideIconPath = '';

  if (!editorType || editorType === EditorType.CUSTOM) {
    // Generic fallback for other IDEs or no IDE configured
    return <Code2 className={className} />;
  }

  switch (editorType) {
    case EditorType.VS_CODE:
      ideIconPath = isDark ? '/ide/vscode-dark.svg' : '/ide/vscode-light.svg';
      break;
    case EditorType.VS_CODE_INSIDERS:
      ideIconPath = '/ide/vscode-insiders.svg';
      break;
    case EditorType.CURSOR:
      ideIconPath = isDark ? '/ide/cursor-dark.svg' : '/ide/cursor-light.svg';
      break;
    case EditorType.WINDSURF:
      ideIconPath = isDark
        ? '/ide/windsurf-dark.svg'
        : '/ide/windsurf-light.svg';
      break;
    case EditorType.INTELLI_J:
      ideIconPath = '/ide/intellij.svg';
      break;
    case EditorType.ZED:
      ideIconPath = isDark ? '/ide/zed-dark.svg' : '/ide/zed-light.svg';
      break;
    case EditorType.XCODE:
      ideIconPath = '/ide/xcode.svg';
      break;
    case EditorType.GOOGLE_ANTIGRAVITY:
      ideIconPath = isDark
        ? '/ide/antigravity-dark.svg'
        : '/ide/antigravity-light.svg';
      break;
  }

  return <img src={ideIconPath} alt={ideName} className={className} />;
}
