#!/usr/bin/env node
import { verify } from '../../lib/harness/index.js';

const args = process.argv.slice(2);
const mode = args[0] || 'local';

const modeMap: Record<string, 'verify-local' | 'verify-all' | 'verify-security'> = {
  local: 'verify-local',
  all: 'verify-all',
  security: 'verify-security',
};

const verifyMode = modeMap[mode] || 'verify-local';

async function main() {
  console.log(`Running ${verifyMode}...`);
  try {
    const report = await verify({ mode: verifyMode });
    console.log(`\nReport saved to: .harness/reports/${report.feature}/`);
    console.log(`Duration: ${(report.duration / 1000).toFixed(1)}s`);

    const allPassed = report.issues.length === 0;
    if (allPassed) {
      console.log('All checks passed');
      process.exit(0);
    } else {
      console.log(`\n${report.issues.length} issue(s) found:`);
      report.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue.file}:${issue.line} - ${issue.message}`);
      });
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
