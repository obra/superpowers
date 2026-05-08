import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

function read(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

test('skills tree ships the unified skill set directly', () => {
  const skillsRoot = resolve(root, 'plugins/nimbou-skills/skills')
  const shippedSkills = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  assert.equal(existsSync(skillsRoot), true)
  assert.ok(shippedSkills.includes('nestjs-think'))
  assert.ok(shippedSkills.includes('nestjs-plan'))
  assert.ok(shippedSkills.includes('nestjs-refactor'))
  assert.ok(shippedSkills.includes('executing-plans'))
  assert.ok(shippedSkills.includes('e2e-test-quality'))
  assert.ok(shippedSkills.includes('change-spec'))
  assert.ok(shippedSkills.includes('feat-spec'))
  assert.ok(shippedSkills.includes('doc-domain'))
  assert.ok(shippedSkills.includes('doc-gherkin'))
  assert.ok(shippedSkills.includes('doc-openapi'))
  assert.ok(shippedSkills.includes('request-review'))
  assert.ok(shippedSkills.includes('apply-review'))
  assert.ok(shippedSkills.includes('nuxt-think'))
  assert.ok(shippedSkills.includes('nuxt-plan'))
  assert.ok(shippedSkills.includes('nuxt-catalog'))
  assert.ok(shippedSkills.includes('nuxt-audit'))
  assert.ok(shippedSkills.includes('nuxt-test'))
  assert.ok(shippedSkills.includes('nestjs-debug'))
  assert.ok(shippedSkills.includes('nuxt-debug'))
  assert.ok(shippedSkills.includes('nestjs-test'))
  assert.equal(shippedSkills.includes('nestjs-audit-http-tests'), false)
  assert.equal(shippedSkills.includes('nestjs-audit-prisma-repositories'), false)

  for (const skillName of shippedSkills) {
    const skillFile = resolve(skillsRoot, skillName, 'SKILL.md')
    assert.equal(existsSync(skillFile), true, `Missing scaffold file: ${skillFile}`)
    assert.match(readFileSync(skillFile, 'utf8'), /^---\nname: /, `Missing frontmatter in ${skillFile}`)
  }

  assert.equal(existsSync(resolve(root, '.claude-plugin/marketplace.json')), true)
  assert.equal(existsSync(resolve(root, 'plugins/nimbou-skills/.codex-plugin/plugin.json')), true)
  assert.equal(existsSync(resolve(root, '.agents/plugins/marketplace.json')), true)

  const codexPlugin = JSON.parse(read('plugins/nimbou-skills/.codex-plugin/plugin.json'))
  const codexMarketplace = JSON.parse(read('.agents/plugins/marketplace.json'))

  assert.equal(codexPlugin.name, 'nimbou-skills')
  assert.equal(codexPlugin.skills, './skills/')
  assert.equal(codexMarketplace.name, 'nimbou-skills')
  assert.equal(codexMarketplace.plugins[0].policy.installation, 'INSTALLED_BY_DEFAULT')
  assert.equal(codexMarketplace.plugins[0].source.source, 'local')
  assert.equal(codexMarketplace.plugins[0].source.path, './plugins/nimbou-skills')
})

test('command and agent scaffolds exist for design, merge, and review workflows', () => {
  const files = [
    'plugins/nimbou-skills/commands/design-md.md',
    'plugins/nimbou-skills/commands/merge-pr.md',
    '.codex/skills/design-md/SKILL.md',
    '.codex/skills/merge-pr/SKILL.md',
    'scripts/setup-chrome-devtools-wrapper.sh',
    'scripts/setup-codex-skills.sh',
    'plugins/nimbou-skills/agents/code-explorer.md',
    'plugins/nimbou-skills/agents/code-architect.md',
    'plugins/nimbou-skills/agents/code-reviewer.md',
    'plugins/nimbou-skills/agents/guidelines-gap-analyzer.md',
    'plugins/nimbou-skills/agents/e2e-quality-auditor.md',
    'plugins/nimbou-skills/agents/nestjs-boundary-refactorer.md',
    'plugins/nimbou-skills/agents/prisma-boundary-refactorer.md',
    'plugins/nimbou-skills/skills/nuxt-audit/reference/design-md-template.md',
    'plugins/nimbou-skills/skills/nuxt-audit/reference/guidelines-template.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }
})

test('specification skills and think orchestrators document the domain-centered layout and gate', () => {
  const files = [
    'plugins/nimbou-skills/skills/doc-domain/SKILL.md',
    'plugins/nimbou-skills/skills/doc-gherkin/SKILL.md',
    'plugins/nimbou-skills/skills/doc-openapi/SKILL.md',
    'plugins/nimbou-skills/skills/change-spec/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-think/SKILL.md',
    'plugins/nimbou-skills/skills/nestjs-think/SKILL.md',
    'plugins/nimbou-skills/skills/feat-spec/SKILL.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const domainSkill = read('plugins/nimbou-skills/skills/doc-domain/SKILL.md')
  const gherkinSkill = read('plugins/nimbou-skills/skills/doc-gherkin/SKILL.md')
  const openapiSkill = read('plugins/nimbou-skills/skills/doc-openapi/SKILL.md')
  const changeSpec = read('plugins/nimbou-skills/skills/change-spec/SKILL.md')
  const nuxtThink = read('plugins/nimbou-skills/skills/nuxt-think/SKILL.md')
  const nestjsThink = read('plugins/nimbou-skills/skills/nestjs-think/SKILL.md')
  const featSpec = read('plugins/nimbou-skills/skills/feat-spec/SKILL.md')

  assert.match(domainSkill, /docs\/domain\/<domain>\/domain\.md/)
  assert.match(domainSkill, /domain-centered/i)
  assert.match(domainSkill, /^---\nname: doc-domain/m)
  assert.match(gherkinSkill, /docs\/domain\/<domain>\/\*\.feature/)
  assert.match(gherkinSkill, /shared specification layer/i)
  assert.match(gherkinSkill, /^---\nname: doc-gherkin/m)
  assert.match(openapiSkill, /docs\/domain\/<domain>\/openapi\.yaml/)
  assert.match(openapiSkill, /canonical HTTP transport contract/i)
  assert.match(openapiSkill, /after `domain\.md`, `\.feature` files, and backend contract decisions are approved/i)
  assert.match(openapiSkill, /after `nestjs-think` and before `nuxt-think`/i)
  assert.match(openapiSkill, /^---\nname: doc-openapi/m)
  assert.match(nuxtThink, /docs\/domain\/<domain>\//)
  assert.match(nuxtThink, /confirm `docs\/domain\/<domain>\/domain\.md` is approved/i)
  assert.match(nuxtThink, /confirm the relevant `docs\/domain\/<domain>\/\*\.feature` files are approved/i)
  assert.match(nuxtThink, /confirm `docs\/domain\/<domain>\/openapi\.yaml` is approved/i)
  assert.match(nuxtThink, /do not redefine the HTTP contract inside `nuxt-think`; consume the approved `openapi\.yaml`/i)
  assert.match(nuxtThink, /only after approval, invoke `nuxt-plan`/i)
  assert.match(nuxtThink, /do not advance to `nuxt-plan` with stale domain, Gherkin, or OpenAPI artifacts/i)
  assert.match(nuxtThink, /`docs\/domain\/<domain>\/domain\.md` approved\./i)
  assert.match(nuxtThink, /`docs\/domain\/<domain>\/\*\.feature` approved\./i)
  assert.match(nuxtThink, /`docs\/domain\/<domain>\/openapi\.yaml` approved when the feature changes HTTP\./i)
  assert.match(nuxtThink, /use `feat-spec` when the request changes both frontend and backend/i)
  assert.match(nuxtThink, /use `change-spec` when the request changes both frontend and backend in an existing flow/i)

  assert.match(nestjsThink, /docs\/domain\/<domain>\//)
  assert.match(nestjsThink, /use `doc-domain` to create or update `docs\/domain\/<domain>\/domain\.md`/i)
  assert.match(nestjsThink, /use `doc-gherkin` to create or update `docs\/domain\/<domain>\/\*\.feature`/i)
  assert.match(nestjsThink, /complete this gate before checklist step 1/i)
  assert.match(nestjsThink, /present the domain and Gherkin artifacts for approval/i)
  assert.match(nestjsThink, /do not advance with stale domain or Gherkin artifacts/i)
  assert.match(nestjsThink, /if state transitions changed, regenerate the affected `\.feature` files before planning/i)
  assert.match(nestjsThink, /do not do the `domain\.md` or `\*\.feature` work inline inside `nestjs-think`/i)
  assert.match(nestjsThink, /close persistence viability .* repositories, transactions, Prisma boundaries, constraints, and schema impact/i)
  assert.match(nestjsThink, /if the request splits into multiple independent domains, split them and close one domain at a time/i)
  assert.match(nestjsThink, /only after `doc-openapi` and `nuxt-think` are approved, invoke `nestjs-plan`/i)
  assert.match(nestjsThink, /`docs\/domain\/<domain>\/domain\.md` approved\./i)
  assert.match(nestjsThink, /`docs\/domain\/<domain>\/\*\.feature` approved\./i)
  assert.match(nestjsThink, /`doc-openapi` is ready to publish `docs\/domain\/<domain>\/openapi\.yaml` when the feature changes HTTP\./i)
  assert.match(nestjsThink, /persistence viability, Prisma\/schema impact/i)
  assert.match(nestjsThink, /use `feat-spec` when the request changes both frontend and backend/i)
  assert.match(nestjsThink, /use `change-spec` when the request changes both frontend and backend in an existing flow/i)

  assert.match(changeSpec, /^---\nname: change-spec/m)
  assert.match(changeSpec, /changes both frontend and backend in an existing flow/i)
  assert.match(changeSpec, /return a single frontend\/backend plan in chat/i)
  assert.match(changeSpec, /do not create or update `docs\/domain\/<domain>\/domain\.md`/i)
  assert.match(changeSpec, /consume them as constraints instead of generating files/i)
  assert.match(changeSpec, /impact checklist/i)
  assert.match(changeSpec, /contracts, UI states, jobs, permissions, tests, migrations, and compatibility/i)
  assert.match(changeSpec, /## Ondas de Execução/i)
  assert.match(changeSpec, /`executing-plans` or `subagent-driven-development`/i)

  assert.match(featSpec, /^---\nname: feat-spec/m)
  assert.match(featSpec, /feature changes both frontend and backend/i)
  assert.match(featSpec, /use `doc-domain`/i)
  assert.match(featSpec, /use `doc-gherkin`/i)
  assert.doesNotMatch(featSpec, /use `doc-openapi`/i)
  assert.match(featSpec, /close the shared feature design, ownership boundary, and preliminary contract/i)
  assert.match(featSpec, /does not replace the platform-specific think skills/i)
  assert.match(featSpec, /route the next contract step to `nestjs-think`/i)
  assert.match(featSpec, /generated specification artifacts/i)
  assert.match(featSpec, /required next skill: `nestjs-think`/i)
})

test('platform test skills consume approved Gherkin and route backend audits', () => {
  const files = [
    'plugins/nimbou-skills/skills/nuxt-test/SKILL.md',
    'plugins/nimbou-skills/skills/nuxt-test/reference/test-conventions.md',
    'plugins/nimbou-skills/skills/nestjs-test/SKILL.md',
    'plugins/nimbou-skills/skills/nestjs-test/reference/test-conventions.md',
  ]

  for (const file of files) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const nuxtTest = read('plugins/nimbou-skills/skills/nuxt-test/SKILL.md')
  const nuxtRules = read('plugins/nimbou-skills/skills/nuxt-test/reference/test-conventions.md')
  const nestjsTest = read('plugins/nimbou-skills/skills/nestjs-test/SKILL.md')
  const nestjsRules = read('plugins/nimbou-skills/skills/nestjs-test/reference/test-conventions.md')

  assert.match(nuxtTest, /Read `reference\/test-conventions\.md` before changing tests\./i)
  assert.match(nuxtTest, /turn approved Gherkin into bounded Playwright coverage/i)
  assert.match(nuxtTest, /approved Gherkin/i)
  assert.match(nuxtTest, /docs\/domain\/<domain>\/\*\.feature/)
  assert.match(nuxtTest, /explicit gap report/i)
  assert.match(nuxtRules, /getByRole\(\)/)
  assert.match(nuxtRules, /getByTestId\(\)/)
  assert.match(nuxtRules, /waitForTimeout\(\)/)
  assert.match(nuxtRules, /one critical happy path/i)
  assert.match(nuxtRules, /meaningful non-happy-path state/i)
  assert.match(nestjsTest, /^---\nname: nestjs-test/m)
  assert.match(nestjsTest, /Read `reference\/test-conventions\.md` before changing tests\./i)
  assert.match(nestjsTest, /approved Gherkin/i)
  assert.match(nestjsTest, /Use this skill when the main job is:/i)
  assert.match(nestjsTest, /gherkin-driven mode/i)
  assert.match(nestjsTest, /audit mode/i)
  assert.match(nestjsTest, /stabilize mode/i)
  assert.match(nestjsTest, /## Workflow/)
  assert.match(nestjsTest, /bounded backend flow or persistence slice/i)
  assert.match(nestjsTest, /nestjs-http-test-auditor/i)
  assert.match(nestjsTest, /prisma-repository-test-auditor/i)
  assert.match(nestjsRules, /bounded backend flow or persistence slice/i)
  assert.match(nestjsRules, /explicit HTTP status, payload shape, and database state assertions/i)
  assert.match(nestjsRules, /nestjs-debug/i)
})

test('nestjs-refactor defines bounded backend refactor orchestration and agent ownership', () => {
  const skillFile = 'plugins/nimbou-skills/skills/nestjs-refactor/SKILL.md'
  const boundaryAgentFile = 'plugins/nimbou-skills/agents/nestjs-boundary-refactorer.md'
  const prismaAgentFile = 'plugins/nimbou-skills/agents/prisma-boundary-refactorer.md'

  for (const file of [skillFile, boundaryAgentFile, prismaAgentFile]) {
    assert.equal(existsSync(resolve(root, file)), true, `${file} should exist`)
  }

  const skill = read(skillFile)
  const boundaryAgent = read(boundaryAgentFile)
  const prismaAgent = read(prismaAgentFile)

  assert.match(skill, /^---\nname: nestjs-refactor/m)
  assert.match(skill, /restore SOLID and Clean Architecture boundaries/i)
  assert.match(skill, /Stabilize behavior first\. Refactor structure second\./i)
  assert.match(skill, /docs\/plans\/YYYY-MM-DD-<topic>-refactor\.md/i)
  assert.match(skill, /`nestjs-boundary-refactorer`/i)
  assert.match(skill, /`prisma-boundary-refactorer`/i)
  assert.match(skill, /Dispatch agents in parallel only when they have different bounded slices and disjoint write sets/i)
  assert.match(skill, /if the refactor is within one module, run the batches sequentially/i)
  assert.match(skill, /use `nestjs-debug`/i)
  assert.match(skill, /use `nestjs-think`/i)
  assert.match(skill, /use `nestjs-test`/i)

  assert.match(boundaryAgent, /^---\nname: 'nestjs-boundary-refactorer'/m)
  assert.match(boundaryAgent, /controllers stay thin/i)
  assert.match(boundaryAgent, /You are not alone in the codebase/i)
  assert.match(boundaryAgent, /Prisma schema changes/i)
  assert.match(boundaryAgent, /application-layer interfaces such as repository contracts/i)

  assert.match(prismaAgent, /^---\nname: 'prisma-boundary-refactorer'/m)
  assert.match(prismaAgent, /Prisma remains an infrastructure concern/i)
  assert.match(prismaAgent, /You are not alone in the codebase/i)
  assert.match(prismaAgent, /repository integration tests and persistence fixtures/i)
  assert.match(prismaAgent, /controller or DTO refactors/i)
})

test('README documents backend-first core and prefixed NestJS and Nuxt skills', () => {
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
  const install = readFileSync(resolve(root, 'install.sh'), 'utf8')

  assert.match(readme, /canonical skill library/i)
  assert.match(readme, /backend-first/i)
  assert.match(readme, /NestJS/)
  assert.match(readme, /Prisma/)
  assert.match(readme, /design-md/)
  assert.match(readme, /merge-pr/)
  assert.match(readme, /\.codex\/skills\//)
  assert.match(readme, /e2e-test-quality/)
  assert.match(readme, /change-spec/)
  assert.match(readme, /feat-spec/)
  assert.match(readme, /doc-domain/)
  assert.match(readme, /doc-gherkin/)
  assert.match(readme, /doc-openapi/)
  assert.match(readme, /nestjs-refactor/)
  assert.match(readme, /request-review/)
  assert.match(readme, /apply-review/)
  assert.match(
    readme,
    /### Core workflow skills[\s\S]*- `change-spec`[\s\S]*- `feat-spec`[\s\S]*?### NestJS-specific skills/s,
  )
  assert.match(readme, /nestjs-think/)
  assert.match(readme, /nestjs-plan/)
  assert.match(readme, /nestjs-test/)
  assert.match(readme, /nuxt-think/)
  assert.match(readme, /nuxt-plan/)
  assert.match(readme, /nuxt-catalog/)
  assert.match(readme, /nuxt-audit/)
  assert.match(readme, /nuxt-test/)
  assert.match(readme, /nuxt-debug/)
  assert.match(readme, /mixed-request entry point/i)
  assert.match(readme, /`change-spec` handles mixed changes over existing flows/i)
  assert.match(readme, /closes the shared feature contract and ownership boundary first/i)
  assert.match(readme, /hands backend contract closure to `nestjs-think`/i)
  assert.match(readme, /keeps backend contract and persistence viability together/i)
  assert.match(readme, /publishes the canonical HTTP transport artifact .* after `nestjs-think` and before `nuxt-think`/i)
  assert.match(readme, /canonical HTTP transport artifact/i)
  assert.match(readme, /frontend-only requests stay in `nuxt-think`/i)
  assert.match(readme, /backend-only requests stay in `nestjs-think`/i)
  assert.doesNotMatch(readme, /feature-dev/)
  assert.doesNotMatch(readme, /nestjs-audit-http-tests/)
  assert.doesNotMatch(readme, /nestjs-audit-prisma-repositories/)
  assert.match(readme, /\.\/install\.sh/)
  assert.match(readme, /Codex-only mirrors/)
  assert.match(readme, /nb-catalog/)
  assert.match(readme, /single frontend review pass/i)
  assert.match(readme, /\.generated\/component-catalog\/components\.meta\.json/)
  assert.match(readme, /codex-full/)
  assert.match(readme, /dangerously-bypass-approvals-and-sandbox/)
  assert.match(readme, /registers and installs the Claude Code plugin/)
  assert.match(readme, /compares the installed Claude Code plugin version/)
  assert.match(readme, /Codex marketplace/i)
  assert.match(readme, /\.agents\/plugins\/marketplace\.json/)
  assert.match(readme, /Codex `rust-v0\.121\.0\+` or newer/i)
  assert.match(readme, /does not support `codex plugin marketplace add`/i)
  assert.match(readme, /runs `npm link` for `nb-catalog`/)
  assert.match(readme, /installs `@google\/design\.md` globally/i)
  assert.match(readme, /design\.md lint/i)
  assert.match(readme, /chrome-devtools-mcp-wayland/)
  assert.match(readme, /rewrites `~\/\.codex\/config\.toml`/)
  assert.match(readme, /VS Code Copilot Chat/i)
  assert.match(readme, /~\/\.copilot\/skills/)
  assert.match(readme, /~\/\.config\/Code\/User\/prompts/)
  assert.match(install, /setup-codex-full-wrapper\.sh/)
  assert.match(install, /setup-chrome-devtools-wrapper\.sh/)
  assert.match(install, /setup-vscode-copilot-chat\.sh/)
  assert.match(install, /setup-codex-skills\.sh/)
  assert.match(install, /@google\/design\.md/)
  assert.match(install, /design\.md/)
  assert.match(install, /CODEX_WRAPPER_PATH/)
  assert.match(install, /CHROME_DEVTOOLS_MCP_WRAPPER_PATH/)
  assert.match(install, /VS Code Copilot Chat/i)
  assert.match(install, /COPILOT_CHAT_SKILLS_DIR/)
  assert.match(install, /VSCODE_USER_PROMPTS_DIR/)
  assert.match(install, /Codex skills/i)
  assert.match(install, /\.codex\/skills/)
  assert.match(install, /\.claude-plugin\/plugin\.json/)
  assert.match(install, /claude plugin list --json/)
  assert.match(install, /Claude Code plugin already installed at version/)
  assert.match(install, /Installing Claude Code plugin version/)
  assert.match(install, /codex plugin marketplace/i)
  assert.match(install, /Install Codex rust-v0\.121\.0\+ or newer/)
  assert.match(install, /Codex marketplace support is required/)
  assert.match(install, /\.agents\/plugins\/marketplace\.json/)
  assert.doesNotMatch(install, /local skill-tree fallback/)
  assert.doesNotMatch(install, /link_skill_tree/)
  assert.equal(existsSync(resolve(root, 'scripts/setup-vscode-copilot-chat.sh')), true)
  assert.equal(existsSync(resolve(root, 'LICENSE')), true)
})
