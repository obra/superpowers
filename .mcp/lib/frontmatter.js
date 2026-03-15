/**
 * frontmatter.js
 *
 * Parses and strips YAML frontmatter from markdown files.
 * No external dependencies — only standard string operations.
 */

/**
 * Parse frontmatter from a markdown string.
 *
 * @param {string} raw - Full file content
 * @returns {{ frontmatter: Record<string,string>, body: string }}
 */
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: match[2].trimStart() };
}
