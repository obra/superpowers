import { cpSync, rmSync, existsSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";

const dir = dirname(fileURLToPath(import.meta.url));
const src = join(dir, "..", "..", "skills");
const dest = join(dir, "..", "skills");

// Files/directories to exclude from the plugin
const EXCLUDE_PATTERNS = [
  "render-graphs.js",
  "diagrams",
];

function copyDirectoryRecursive(source, destination) {
  if (!existsSync(source)) return;

  const entries = readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(source, entry.name);
    const destPath = join(destination, entry.name);

    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.includes(entry.name)) {
      console.log(`  Excluding: ${entry.name}`);
      continue;
    }

    if (entry.isDirectory()) {
      cpSync(srcPath, destPath, { recursive: true });
    } else {
      cpSync(srcPath, destPath);
    }
  }
}

if (!existsSync(src)) {
  console.error(`✗ Source skills directory not found: ${src}`);
  process.exit(1);
}

try {
  rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true });

  // Remove excluded files after copy
  for (const pattern of EXCLUDE_PATTERNS) {
    const writingSkillsDir = join(dest, "writing-skills");
    const excludePath = join(writingSkillsDir, pattern);
    if (existsSync(excludePath)) {
      if (pattern.endsWith(".js")) {
        unlinkSync(excludePath);
        console.log(`  Excluded: skills/writing-skills/${pattern}`);
      } else {
        rmSync(excludePath, { recursive: true, force: true });
        console.log(`  Excluded: skills/writing-skills/${pattern}`);
      }
    }
  }

  console.log("✓ skills copied from ../skills");
} catch (err) {
  console.error(`✗ Failed to copy skills: ${err.message}`);
  process.exit(1);
}
