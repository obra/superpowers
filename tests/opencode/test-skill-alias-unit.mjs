#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { rewriteBareSkillName } from "../../.opencode/skill-alias.js";

const makeSkill = (baseDir, name) => {
  const skillDir = path.join(baseDir, name);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, "SKILL.md"), `# ${name}\n`, "utf8");
};

const root = fs.mkdtempSync(path.join(os.tmpdir(), "sp-skill-alias-"));
const projectSkillsDir = path.join(root, "project", ".opencode", "skills");
const userSkillsDir = path.join(root, "user", "skills");
const superpowersSkillsDir = path.join(root, "superpowers", "skills");

fs.mkdirSync(projectSkillsDir, { recursive: true });
fs.mkdirSync(userSkillsDir, { recursive: true });
fs.mkdirSync(superpowersSkillsDir, { recursive: true });

makeSkill(superpowersSkillsDir, "brainstorming");
makeSkill(superpowersSkillsDir, "writing-plans");

const dirs = { projectSkillsDir, userSkillsDir, superpowersSkillsDir };

assert.equal(rewriteBareSkillName("brainstorming", dirs), "superpowers/brainstorming");
assert.equal(rewriteBareSkillName("Brainstorming", dirs), "Brainstorming");
assert.equal(rewriteBareSkillName(" superpowers/brainstorming ", dirs), "superpowers/brainstorming");
assert.equal(rewriteBareSkillName("superpowers:brainstorming", dirs), "superpowers:brainstorming");
assert.equal(rewriteBareSkillName("unknown-skill", dirs), "unknown-skill");

makeSkill(projectSkillsDir, "brainstorming");
assert.equal(rewriteBareSkillName("brainstorming", dirs), "brainstorming");

fs.rmSync(path.join(projectSkillsDir, "brainstorming"), { recursive: true, force: true });
makeSkill(userSkillsDir, "brainstorming");
assert.equal(rewriteBareSkillName("brainstorming", dirs), "brainstorming");

console.log("test-skill-alias-unit: PASS");
