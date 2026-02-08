import { execSync } from 'child_process';

const REF = 'refs/notes/superpowers';

try {
    console.log(`Pushing findings to origin...`);
    execSync(`git push origin ${REF}:${REF}`, { stdio: 'inherit' });
    console.log(`✅ Findings pushed successfully.`);
} catch (error) {
    console.error(`❌ Failed to push findings: ${error.message}`);
    process.exit(1);
}
