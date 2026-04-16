import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const spectralRoot = path.resolve(__dirname, '..');
const targetDir = process.cwd();

const spectralFolder = path.join(targetDir, '.spectral');
const templatesFolder = path.join(spectralFolder, 'templates');
const memoryFolder = path.join(spectralFolder, 'memory');

const sourceTemplatesDir = path.join(spectralRoot, 'skills', 'init', 'templates');

function init() {
    console.log(`Initializing Spectral in: ${targetDir}`);

    try {
        // 1. Create directory structure
        if (!fs.existsSync(spectralFolder)) fs.mkdirSync(spectralFolder);
        if (!fs.existsSync(templatesFolder)) fs.mkdirSync(templatesFolder);
        if (!fs.existsSync(memoryFolder)) fs.mkdirSync(memoryFolder);

        // 2. Identify templates to copy
        const templates = [
            'spec-template.md',
            'plan-template.md',
            'tasks-template.md',
            'constitution-template.md'
        ];

        // 3. Copy templates
        templates.forEach(template => {
            const src = path.join(sourceTemplatesDir, template);
            const dest = path.join(templatesFolder, template);

            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
                console.log(`Created: .spectral/templates/${template}`);
            } else {
                console.warn(`Warning: Template not found at ${src}`);
            }
        });

        // 4. Initialize constitution in memory
        const constitutionSrc = path.join(templatesFolder, 'constitution-template.md');
        const constitutionDest = path.join(memoryFolder, 'constitution.md');
        if (fs.existsSync(constitutionSrc)) {
            fs.copyFileSync(constitutionSrc, constitutionDest);
            console.log(`Created: .spectral/memory/constitution.md`);
        }

        console.log('\nSuccess: Spectral workspace initialized successfully.');
    } catch (error) {
        console.error(`Error during initialization: ${error.message}`);
        process.exit(1);
    }
}

init();
