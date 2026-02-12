const fs = require('fs');
const path = require('path');

function generateIndex(skillsDir, outputFile) {
    let indexContent = "# Superpowers Skills Index\n\n";
    indexContent += "This index provides a lightweight summary of all available skills. Use this to discover relevant skills before loading their full instructions.\n\n";
    indexContent += "| Skill Name | Description |\n";
    indexContent += "|------------|-------------|\n";

    const getFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(getFiles(file));
            } else if (file.endsWith('SKILL.md')) {
                results.push(file);
            }
        });
        return results;
    };

    const skillFiles = getFiles(skillsDir);

    skillFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const descMatch = content.match(/^description:\s*(.+)$/m);

        const name = nameMatch ? nameMatch[1].trim() : path.basename(path.dirname(file));
        const description = descMatch ? descMatch[1].trim().replace(/^"|"$/g, '') : "No description available.";

        indexContent += `| ${name} | ${description} |\n`;
    });

    fs.writeFileSync(outputFile, indexContent);
    console.log(`Generated index at ${outputFile}`);
}

const baseDir = path.resolve(__dirname, '../..');
const skillsDir = path.join(baseDir, 'skills');
const outputFile = path.join(baseDir, 'skills/SKILLS_INDEX.md');

generateIndex(skillsDir, outputFile);
