import { EditorType } from 'shared/types';
import i18n from '@/i18n';

export function getIdeName(editorType: EditorType | undefined | null): string {
  if (!editorType) return 'IDE';
  switch (editorType) {
    case EditorType.VS_CODE:
      return 'VS Code';
    case EditorType.VS_CODE_INSIDERS:
      return 'VS Code Insiders';
    case EditorType.CURSOR:
      return 'Cursor';
    case EditorType.WINDSURF:
      return 'Windsurf';
    case EditorType.INTELLI_J:
      return 'IntelliJ IDEA';
    case EditorType.ZED:
      return 'Zed';
    case EditorType.XCODE:
      return 'Xcode';
    case EditorType.CUSTOM:
      return i18n.t('common:editorNames.custom');
    case EditorType.GOOGLE_ANTIGRAVITY:
      return 'Antigravity';
  }
}
