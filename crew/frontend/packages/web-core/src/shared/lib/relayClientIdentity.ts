export interface RelayClientIdentity {
  clientId: string;
  clientName: string;
  clientBrowser: string;
  clientOs: string;
  clientDevice: string;
}

export function createRelayClientIdentity(): RelayClientIdentity {
  const userAgent = navigator.userAgent;
  const clientBrowser = detectBrowser(userAgent);
  const clientOs = detectOs(userAgent);
  const clientDevice = detectDevice(userAgent);
  const clientName = `${clientBrowser} on ${clientOs} (${toTitleCase(clientDevice)})`;

  return {
    clientId: crypto.randomUUID(),
    clientName,
    clientBrowser,
    clientOs,
    clientDevice,
  };
}

function detectBrowser(userAgent: string): string {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Chrome\//.test(userAgent) || /CriOS\//.test(userAgent)) return 'Chrome';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return 'Unknown Browser';
}

function detectOs(userAgent: string): string {
  if (/Windows NT/.test(userAgent)) return 'Windows';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'macOS';
  if (/Android/.test(userAgent)) return 'Android';
  if (/Linux/.test(userAgent)) return 'Linux';
  return 'Unknown OS';
}

function detectDevice(userAgent: string): string {
  if (/iPad|Tablet|PlayBook|Silk/.test(userAgent)) return 'tablet';
  if (/Mobi|Android|iPhone|iPod/.test(userAgent)) return 'mobile';
  return 'desktop';
}

function toTitleCase(value: string): string {
  if (!value) return value;
  return `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`;
}
