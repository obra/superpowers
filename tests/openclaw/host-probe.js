import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [openclawRoot, pluginRoot, workspaceDir] = process.argv.slice(2).map((arg) => resolve(arg));
await mkdir(workspaceDir, { recursive: true });

const loadPluginsUrl = pathToFileURL(resolve(openclawRoot, 'src/plugins/loader.ts')).href;
const bootstrapUrl = pathToFileURL(resolve(openclawRoot, 'src/agents/bootstrap-files.ts')).href;
const [{ loadOpenClawPlugins }, { resolveBootstrapContextForRun }] = await Promise.all([
  import(loadPluginsUrl),
  import(bootstrapUrl),
]);

const config = {
  plugins: {
    load: { paths: [pluginRoot] },
    allow: ['superpowers'],
    entries: { superpowers: { enabled: true } },
  },
};
const registry = loadOpenClawPlugins({
  config,
  workspaceDir,
  onlyPluginIds: ['superpowers'],
  activate: true,
});
const plugin = registry.plugins.find((entry) => entry.id === 'superpowers');
const context = await resolveBootstrapContextForRun({
  config,
  workspaceDir,
  sessionKey: 'agent:main:clean-session',
});

console.log(JSON.stringify({
  plugin: plugin && { format: plugin.format, status: plugin.status, hookNames: plugin.hookNames },
  contextFiles: context.contextFiles.map((file) => ({ name: file.name, content: file.content })),
}));
