import fs from 'fs';
import path from 'path';

export class LocalAdapter {
    constructor(config) {
        this.todoFile = config.todo_file || 'TODO.md';
        this.filePath = path.join(process.cwd(), this.todoFile);
    }

    ensureFile() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, '# Tasks\n\n');
        }
    }

    async createTask(title, description = '', type = 'Task') {
        this.ensureFile();
        const content = fs.readFileSync(this.filePath, 'utf8');
        const id = `LOCAL-${Date.now().toString().slice(-4)}`;
        const newEntry = `\n## [${id}] ${title} (${type})\n${description}\n- [ ] Status: Pending\n`;

        fs.appendFileSync(this.filePath, newEntry);
        console.log(`Created local task: ${id}`);
        return { id, key: id, url: this.filePath };
    }

    async logWork(id, timeSpent, comment = '') {
        this.ensureFile();
        let content = fs.readFileSync(this.filePath, 'utf8');
        const taskRegex = new RegExp(`## \\[${id}\\].*`, 'g');
        const match = taskRegex.exec(content);

        if (!match) {
            throw new Error(`Task ${id} not found locally.`);
        }

        // We append the log under the task header (heuristic: find next ## or end of file)
        // For simplicity, we just append to the end of the task block section?
        // Actually, appending to the specific task block is hard with regex replace without parsing.
        // Let's just append a generic log at the bottom of the file for now, or try to insert.

        // Simpler strategy: Just append to file "WORKLOG [ID]: ..."
        const logEntry = `- Worklog [${id}]: ${timeSpent} - ${comment}\n`;
        fs.appendFileSync(this.filePath, logEntry);
        console.log(`Logged work for ${id}`);
    }

    async createSubtask(parentId, title) {
        // Just a regular task with a reference
        return this.createTask(title, `Parent: ${parentId}`, 'Subtask');
    }
}
