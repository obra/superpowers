export function isMac(): boolean {
  // Modern API (Chrome, Edge) - not supported in Safari
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  if (nav.userAgentData?.platform) {
    return nav.userAgentData.platform === 'macOS';
  }
  // Fallback for Safari and older browsers
  return /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}
