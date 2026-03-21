import fs from 'fs';
import path from 'path';

const hasSkillInDir = (skillsDir, skillName) => {
  if (!skillsDir || !skillName) return false;
  let entries;
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return false;
  }

  const exactDir = entries.find((entry) => entry.isDirectory() && entry.name === skillName);
  if (!exactDir) return false;

  const skillFile = path.join(skillsDir, exactDir.name, 'SKILL.md');
  return fs.existsSync(skillFile);
};

export const rewriteBareSkillName = (skillName, { projectSkillsDir, userSkillsDir, superpowersSkillsDir }) => {
  if (typeof skillName !== 'string') return skillName;

  const trimmed = skillName.trim();
  if (!trimmed) return trimmed;

  if (trimmed.includes('/') || trimmed.includes(':')) return trimmed;

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(trimmed)) return trimmed;

  if (hasSkillInDir(projectSkillsDir, trimmed)) return trimmed;
  if (hasSkillInDir(userSkillsDir, trimmed)) return trimmed;

  if (hasSkillInDir(superpowersSkillsDir, trimmed)) return `superpowers/${trimmed}`;

  return trimmed;
};
