import { loadConfig } from './config-core.js';
import { LocalAdapter } from './adapters/local-adapter.js';
import { NotionAdapter } from './adapters/notion-adapter.js';
import { JiraAdapter } from './adapters/jira-adapter.js';

const config = loadConfig();
const pmConfig = config.project_management || {};
const provider = pmConfig.provider || 'local';

let adapter;

switch (provider) {
    case 'jira':
        adapter = new JiraAdapter(pmConfig.jira);
        break;
    case 'notion':
        adapter = new NotionAdapter(pmConfig.notion);
        break;
    case 'local':
    default:
        adapter = new LocalAdapter(pmConfig.local);
        break;
}

// CLI Logic
if (process.argv[1] === import.meta.filename) {
    const args = process.argv.slice(2);
    const command = args[0];

    // Simple arg parsing
    const getArg = (name) => {
        const index = args.indexOf(`--${name}`);
        return index !== -1 ? args[index + 1] : null;
    };

    (async () => {
        try {
            if (command === 'create') {
                const title = getArg('title');
                const desc = getArg('desc') || '';
                const type = getArg('type') || 'Task';
                if (!title) throw new Error("Missing --title");
                await adapter.createTask(title, desc, type);
            }
            else if (command === 'log-work') {
                const id = getArg('id');
                const time = getArg('time');
                const comment = getArg('comment') || '';
                if (!id || !time) throw new Error("Missing --id or --time");
                await adapter.logWork(id, time, comment);
            }
            else if (command === 'subtask') {
                const parent = getArg('parent');
                const title = getArg('title');
                if (!parent || !title) throw new Error("Missing --parent or --title");
                await adapter.createSubtask(parent, title);
            }
            else {
                console.log("Usage: node lib/task-manager.js [create|log-work|subtask] ...");
            }
        } catch (err) {
            console.error("Error:", err.message);
            process.exit(1);
        }
    })();
}
