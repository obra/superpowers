import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateConstitution } from './generate-constitution.js';
import { generateCodeIndex } from './generate-code-index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const spectralRoot = path.resolve(__dirname, '..');
const targetDir = process.cwd();

const spectralFolder = path.join(targetDir, '.spectral');
const templatesFolder = path.join(spectralFolder, 'templates');
const memoryFolder = path.join(spectralFolder, 'memory');

const sourceTemplatesDir = path.join(spectralRoot, 'skills', 'init', 'templates');

async function init() {
    console.log(`Initializing Spectral in: ${targetDir}`);
    console.log("Running init.js via Node...");
console.log("Platform:", process.platform);
console.log("Shell env:", process.env.SHELL || process.env.ComSpec);
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

        // 4. Generate constitution from project signals and optional user rules.
        const constitutionDest = path.join(memoryFolder, 'constitution.md');
        const rulesFile = path.join(memoryFolder, 'rules-input.md');
        const envRules = process.env.SPECTRAL_INIT_RULES || '';
        const fileRules = fs.existsSync(rulesFile) ? fs.readFileSync(rulesFile, 'utf8') : '';
        const rulesText = envRules || fileRules;
        generateConstitution({
            targetDir,
            outPath: constitutionDest,
            rulesText
        });
        console.log('Created: .spectral/memory/constitution.md');

        // 5. Generate a metadata-only code index for index-first retrieval.
        const codeIndexDest = path.join(spectralFolder, 'code_index.json');
        try {
            const codeIndexResult = await generateCodeIndex({
                targetDir,
                outPath: codeIndexDest,
                mode: 'incremental'
            });
            console.log(
                `Created: .spectral/code_index.json (${codeIndexResult.stats.scannedFiles} scanned, ${codeIndexResult.stats.reusedFiles} reused, ${codeIndexResult.stats.changedFiles} changed, ${codeIndexResult.stats.deletedFiles} deleted)`
            );
        } catch (indexError) {
            console.warn(`Warning: code index generation failed (${indexError.message}). Init will continue without index.`);
        }

        console.log('\nSuccess: Spectral workspace initialized successfully.');
    } catch (error) {
        console.error(`Error during initialization: ${error.message}`);
        process.exit(1);
    }
}

init();
