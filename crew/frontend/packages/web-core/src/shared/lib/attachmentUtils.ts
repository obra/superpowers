/** Downloads a file from a URL and triggers a browser save dialog. */
export async function downloadBlobUrl(
  url: string,
  filename: string
): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new Error('Failed to download attachment file');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Extracts attachment IDs from `attachment://` references in markdown content. */
export function extractAttachmentIds(content: string): Set<string> {
  const ids = new Set<string>();
  const regex = /attachment:\/\/([a-f0-9-]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    ids.add(match[1]);
  }
  return ids;
}
