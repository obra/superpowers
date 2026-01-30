#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';
import * as skillsCore from '../lib/skills-core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// Utility functions
const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
};

// Manual recursive copy for Node.js < 16.7 (when fs.cpSync is not available)
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function checkCursorInstalled() {
  const spinner = ora('Checking for Cursor installation...').start();
  
  const possiblePaths = process.platform === 'darwin'
    ? ['/Applications/Cursor.app', path.join(os.homedir(), 'Applications/Cursor.app')]
    : process.platform === 'win32'
    ? [
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Cursor'),
        path.join(process.env.PROGRAMFILES || '', 'Cursor'),
      ]
    : ['/usr/bin/cursor', '/usr/local/bin/cursor'];

  const found = possiblePaths.some(p => fs.existsSync(p));
  
  if (!found) {
    spinner.fail('Cursor not found');
    log.error('Please install Cursor from https://cursor.com');
    process.exit(1);
  }
  
  spinner.succeed('Cursor installation detected');
}

async function checkNightlyChannel() {
  log.warn('Agent Skills require Cursor Nightly channel');
  console.log('');
  console.log('To enable Nightly channel:');
  console.log(chalk.dim('  1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)'));
  console.log(chalk.dim('  2. Navigate to Beta tab'));
  console.log(chalk.dim('  3. Set Update Channel to "Nightly"'));
  console.log(chalk.dim('  4. Restart Cursor after update completes'));
  console.log('');
  
  const response = await prompts({
    type: 'confirm',
    name: 'ready',
    message: 'Have you enabled Nightly channel?',
    initial: false
  });
  
  if (!response.ready) {
    log.info('Please enable Nightly channel first, then run this command again');
    process.exit(0);
  }
}

function getRealPathSafe(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch (error) {
    return null;
  }
}

function createSymlink(target, link) {
  try {
    const targetReal = getRealPathSafe(target);

    if (fs.existsSync(link)) {
      const linkStat = fs.lstatSync(link);
      if (linkStat.isSymbolicLink()) {
        fs.unlinkSync(link);
      } else if (linkStat.isDirectory()) {
        const linkReal = getRealPathSafe(link);
        // Check if linkReal is actually inside targetReal (not just a prefix match)
        // Ensure path separator exists to avoid false positives like:
        // targetReal: /path/skills, linkReal: /path/skills-custom
        const isInsideTarget = targetReal && linkReal && (
          linkReal === targetReal ||
          linkReal.startsWith(targetReal + path.sep)
        );
        if (isInsideTarget) {
          fs.rmSync(link, { recursive: true, force: true });
        } else {
          log.warn(`Skipping existing directory: ${link}`);
          return false;
        }
      } else {
        log.warn(`Skipping existing file: ${link}`);
        return false;
      }
    }

    // Create symlink
    fs.symlinkSync(target, link, 'dir');
    return true;
  } catch (error) {
    // On Windows, fall back to junction if symlink fails
    if (process.platform === 'win32') {
      try {
        execSync(`mklink /J "${link}" "${target}"`, { stdio: 'ignore' });
        return true;
      } catch (junctionError) {
        return false;
      }
    }
    return false;
  }
}

function removeLinkedSkills(skillsDir, superpowersSkillsDir) {
  if (!fs.existsSync(skillsDir)) return;

  const skillsReal = getRealPathSafe(superpowersSkillsDir);
  if (!skillsReal) return;

  const entries = fs.readdirSync(skillsDir);
  for (const entry of entries) {
    const entryPath = path.join(skillsDir, entry);
    const entryReal = getRealPathSafe(entryPath);

    // Check if entryReal is actually inside skillsReal (not just a prefix match)
    const isInsideSkills = entryReal && (
      entryReal === skillsReal ||
      entryReal.startsWith(skillsReal + path.sep)
    );
    
    if (isInsideSkills) {
      try {
        fs.rmSync(entryPath, { recursive: true, force: true });
      } catch (err) {
        // Ignore removal errors for individual entries
      }
    }
  }
}

async function installGlobal() {
  console.log('');
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  Global Installation'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('');
  
  const homeDir = os.homedir();
  const targetDir = path.join(homeDir, '.cursor', 'superpowers');
  const skillsDir = path.join(homeDir, '.cursor', 'skills');
  
  // Check if already installed
  if (fs.existsSync(targetDir)) {
    log.warn(`Superpowers already installed at ${targetDir}`);
    const response = await prompts({
      type: 'confirm',
      name: 'reinstall',
      message: 'Reinstall?',
      initial: false
    });
    
    if (response.reinstall) {
      const spinner = ora('Removing existing installation...').start();
      fs.rmSync(targetDir, { recursive: true, force: true });
      spinner.succeed('Removed existing installation');
    } else {
      log.info('Skipping installation');
      return;
    }
  }
  
  // Copy superpowers
  const spinner = ora('Installing Superpowers...').start();
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  
  // Copy superpowers - prefer native cp for better symlink handling
  try {
    execSync(`cp -R "${REPO_ROOT}" "${targetDir}"`, { stdio: 'ignore' });
  } catch (error) {
    // Fallback to Node.js recursive copy (Node.js 16.7+)
    // For older Node.js, use manual recursive copy
    if (typeof fs.cpSync === 'function') {
      fs.cpSync(REPO_ROOT, targetDir, { recursive: true });
    } else {
      // Manual recursive copy for Node.js < 16.7
      copyDirRecursive(REPO_ROOT, targetDir);
    }
  }
  
  spinner.succeed(`Installed Superpowers to ${chalk.dim(targetDir)}`);
  
  // Create skills directory
  fs.mkdirSync(skillsDir, { recursive: true });
  
  // Symlink skills using skills-core discovery
  const linkSpinner = ora('Creating skill symlinks...').start();
  const skillsSourceDir = path.join(targetDir, 'skills');
  
  // Use skills-core to discover skills
  const discoveredSkills = skillsCore.findSkillsInDir(skillsSourceDir, 'superpowers', 3);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const skill of discoveredSkills) {
    const linkPath = path.join(skillsDir, skill.name);
    
    if (createSymlink(skill.path, linkPath)) {
      successCount++;
    } else {
      failCount++;
      log.warn(`Failed to link skill: ${skill.name}`);
    }
  }
  
  linkSpinner.succeed(`Created ${successCount} skill symlinks${failCount > 0 ? chalk.yellow(` (${failCount} failed)`) : ''}`);
  
  console.log('');
  log.success(chalk.bold('Global installation complete!'));
  console.log('');
  console.log('Skills are now available in', chalk.bold('all Cursor projects'));
  console.log(chalk.dim('View skills in: Cursor Settings → Rules → Agent Decides'));
}

async function installLocal() {
  console.log('');
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  Local Installation'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('');
  
  const projectRoot = process.cwd();
  const targetDir = path.join(projectRoot, '.cursor-superpowers');
  const skillsDir = path.join(projectRoot, '.cursor', 'skills');
  
  // Check if already installed
  if (fs.existsSync(targetDir)) {
    log.warn(`Superpowers already installed at ${targetDir}`);
    const response = await prompts({
      type: 'confirm',
      name: 'reinstall',
      message: 'Reinstall?',
      initial: false
    });
    
    if (response.reinstall) {
      const spinner = ora('Removing existing installation...').start();
      fs.rmSync(targetDir, { recursive: true, force: true });
      spinner.succeed('Removed existing installation');
    } else {
      log.info('Skipping installation');
      return;
    }
  }
  
  // Copy superpowers
  const spinner = ora('Installing Superpowers...').start();
  
  // Copy superpowers - prefer native cp for better symlink handling
  try {
    execSync(`cp -R "${REPO_ROOT}" "${targetDir}"`, { stdio: 'ignore' });
  } catch (error) {
    // Fallback to Node.js recursive copy (Node.js 16.7+)
    if (typeof fs.cpSync === 'function') {
      fs.cpSync(REPO_ROOT, targetDir, { recursive: true });
    } else {
      // Manual recursive copy for Node.js < 16.7
      copyDirRecursive(REPO_ROOT, targetDir);
    }
  }
  
  spinner.succeed(`Installed Superpowers to ${chalk.dim('.cursor-superpowers/')}`);
  
  // Create skills directory
  fs.mkdirSync(skillsDir, { recursive: true });
  
  // Symlink skills using skills-core discovery
  const linkSpinner = ora('Creating skill symlinks...').start();
  const skillsSourceDir = path.join(targetDir, 'skills');
  
  // Use skills-core to discover skills
  const discoveredSkills = skillsCore.findSkillsInDir(skillsSourceDir, 'superpowers', 3);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const skill of discoveredSkills) {
    const linkPath = path.join(skillsDir, skill.name);
    
    if (createSymlink(skill.path, linkPath)) {
      successCount++;
    } else {
      failCount++;
      log.warn(`Failed to link skill: ${skill.name}`);
    }
  }
  
  linkSpinner.succeed(`Created ${successCount} skill symlinks${failCount > 0 ? chalk.yellow(` (${failCount} failed)`) : ''}`);
  
  // Update .gitignore
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('.cursor-superpowers')) {
      fs.appendFileSync(gitignorePath, '\n# Superpowers installation\n.cursor-superpowers/\n');
      log.success('Updated .gitignore');
    }
  }
  
  console.log('');
  log.success(chalk.bold('Local installation complete!'));
  console.log('');
  console.log('Skills are now available in', chalk.bold('this project only'));
  console.log(chalk.dim('View skills in: Cursor Settings → Rules → Agent Decides'));
}

function showNextSteps() {
  console.log('');
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  Next Steps'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log('');
  console.log('  1. ' + chalk.bold('Restart Cursor') + ' to load the skills');
  console.log('  2. Open Settings ' + chalk.dim('(Cmd+Shift+J / Ctrl+Shift+J)'));
  console.log('  3. Go to ' + chalk.bold('Rules → Agent Decides') + ' to verify skills loaded');
  console.log('  4. Start using skills:');
  console.log(chalk.dim('     • Type "/" in chat to manually invoke a skill'));
  console.log(chalk.dim('     • Or just describe your task - skills activate automatically'));
  console.log('');
  console.log(chalk.dim('Documentation:'));
  console.log(chalk.dim('  • Cursor: https://cursor.com/cn/docs/context/skills'));
  console.log(chalk.dim('  • Superpowers: https://github.com/obra/superpowers'));
  console.log('');
}

// CLI Commands
program
  .name('superpowers-cursor')
  .description('Superpowers integration for Cursor Agent Skills')
  .version('1.0.0');

program
  .command('install')
  .description('Install Superpowers for Cursor')
  .option('-g, --global', 'Install globally (available in all projects)')
  .option('-l, --local', 'Install locally (current project only)')
  .action(async (options) => {
    console.log('');
    console.log(chalk.bold.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold.blue('  Superpowers for Cursor'));
    console.log(chalk.bold.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    checkCursorInstalled();
    await checkNightlyChannel();
    
    // If no option specified, ask user
    let installType = options.global ? 'global' : options.local ? 'local' : null;
    
    if (!installType) {
      const response = await prompts({
        type: 'select',
        name: 'installType',
        message: 'Installation type:',
        choices: [
          { title: 'Global (available in all projects)', value: 'global' },
          { title: 'Local (current project only)', value: 'local' }
        ],
        initial: 0
      });
      installType = response.installType;
    }
    
    if (!installType) {
      log.error('Installation cancelled');
      process.exit(1);
    }
    
    if (installType === 'global') {
      await installGlobal();
    } else {
      await installLocal();
    }
    
    showNextSteps();
  });

program
  .command('uninstall')
  .description('Uninstall Superpowers from Cursor')
  .option('-g, --global', 'Uninstall from global location')
  .option('-l, --local', 'Uninstall from current project')
  .action(async (options) => {
    const homeDir = os.homedir();
    
    if (options.global) {
      const targetDir = path.join(homeDir, '.cursor', 'superpowers');
      const skillsDir = path.join(homeDir, '.cursor', 'skills');
      
      if (!fs.existsSync(targetDir)) {
        log.info('Superpowers not installed globally');
        return;
      }
      
      const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Remove global Superpowers installation?',
        initial: false
      });
      
      if (response.confirm) {
        const spinner = ora('Uninstalling...').start();
        
        // Remove symlinks/junctions pointing into superpowers skills
        removeLinkedSkills(skillsDir, path.join(targetDir, 'skills'));
        
        // Remove installation directory
        fs.rmSync(targetDir, { recursive: true, force: true });
        
        spinner.succeed('Uninstalled global Superpowers');
      }
    } else if (options.local) {
      const targetDir = path.join(process.cwd(), '.cursor-superpowers');
      const skillsDir = path.join(process.cwd(), '.cursor', 'skills');
      
      if (!fs.existsSync(targetDir)) {
        log.info('Superpowers not installed locally');
        return;
      }
      
      const response = await prompts({
        type: 'confirm',
        name: 'confirm',
        message: 'Remove local Superpowers installation?',
        initial: false
      });
      
      if (response.confirm) {
        const spinner = ora('Uninstalling...').start();
        
        // Remove symlinks/junctions pointing into superpowers skills
        removeLinkedSkills(skillsDir, path.join(targetDir, 'skills'));
        
        // Remove installation directory
        fs.rmSync(targetDir, { recursive: true, force: true });
        
        spinner.succeed('Uninstalled local Superpowers');
      }
    } else {
      log.error('Please specify --global or --local');
    }
  });

program
  .command('list')
  .description('List installed skills')
  .option('-g, --global', 'List global skills')
  .option('-l, --local', 'List local skills')
  .action((options) => {
    const homeDir = os.homedir();
    const locations = [];
    
    if (options.global || !options.local) {
      locations.push({
        name: 'Global',
        superpowersDir: path.join(homeDir, '.cursor', 'superpowers', 'skills'),
        skillsDir: path.join(homeDir, '.cursor', 'skills')
      });
    }
    
    if (options.local || !options.global) {
      locations.push({
        name: 'Local',
        superpowersDir: path.join(process.cwd(), '.cursor-superpowers', 'skills'),
        skillsDir: path.join(process.cwd(), '.cursor', 'skills')
      });
    }
    
    console.log('');
    console.log(chalk.bold('Installed Skills:'));
    console.log('');
    
    let totalCount = 0;
    
    for (const location of locations) {
      if (!fs.existsSync(location.superpowersDir)) {
        console.log(chalk.dim(`${location.name}: Superpowers not installed`));
        console.log('');
        continue;
      }
      
      // Use skills-core to discover superpowers skills
      const discoveredSkills = skillsCore.findSkillsInDir(location.superpowersDir, 'superpowers', 3);
      
      if (discoveredSkills.length === 0) {
        console.log(chalk.dim(`${location.name}: No skills found`));
        console.log('');
        continue;
      }
      
      console.log(chalk.bold(`${location.name} (${discoveredSkills.length} skills):`));
      
      const skillsDirReal = getRealPathSafe(location.superpowersDir);

      for (const skill of discoveredSkills) {
        // Check if skill is linked in .cursor/skills
        const linkPath = path.join(location.skillsDir, skill.name);
        const linkReal = getRealPathSafe(linkPath);
        // Use path.sep to avoid false positives (e.g., skills-custom matching skills)
        const isLinked = linkReal && skillsDirReal && (
          linkReal === skillsDirReal ||
          linkReal.startsWith(skillsDirReal + path.sep)
        );

        if (isLinked) {
          console.log(chalk.green(`  ✓ ${skill.name}`));
          if (skill.description) {
            console.log(chalk.dim(`    ${skill.description}`));
          }
        } else {
          console.log(chalk.dim(`  ○ ${skill.name} (not linked)`));
        }
      }

      // List custom skills not linked to superpowers
      if (fs.existsSync(location.skillsDir)) {
        const entries = fs.readdirSync(location.skillsDir);
        const customSkills = [];

        for (const entry of entries) {
          const entryPath = path.join(location.skillsDir, entry);
          const entryReal = getRealPathSafe(entryPath);
          // Use path.sep to avoid false positives
          const isSuperpowers = entryReal && skillsDirReal && (
            entryReal === skillsDirReal ||
            entryReal.startsWith(skillsDirReal + path.sep)
          );
          if (!isSuperpowers) {
            customSkills.push(entry);
          }
        }

        if (customSkills.length > 0) {
          console.log(chalk.bold('  Custom skills:'));
          for (const custom of customSkills) {
            console.log(chalk.dim(`    • ${custom}`));
          }
        }
      }
      console.log('');
      
      totalCount += discoveredSkills.length;
    }
    
    console.log(chalk.bold(`Total: ${totalCount} skills available`));
    console.log('');
  });

program
  .command('update')
  .description('Update Superpowers installation')
  .option('-g, --global', 'Update global installation')
  .option('-l, --local', 'Update local installation')
  .action(async (options) => {
    const homeDir = os.homedir();
    
    let targetDir;
    if (options.global) {
      targetDir = path.join(homeDir, '.cursor', 'superpowers');
    } else if (options.local) {
      targetDir = path.join(process.cwd(), '.cursor-superpowers');
    } else {
      log.error('Please specify --global or --local');
      return;
    }
    
    if (!fs.existsSync(targetDir)) {
      log.error(`Superpowers not installed at ${targetDir}`);
      return;
    }
    
    const spinner = ora('Checking for updates...').start();
    
    try {
      // Check if it's a git repository
      const gitDir = path.join(targetDir, '.git');
      if (!fs.existsSync(gitDir)) {
        spinner.fail('Not a git repository - cannot update');
        log.info('Reinstall using: npx github:obra/superpowers/.cursor install');
        return;
      }
      
      // Fetch latest
      execSync('git fetch origin', { cwd: targetDir, stdio: 'pipe' });
      
      // Check if behind
      const status = execSync('git status -uno', { cwd: targetDir, encoding: 'utf8' });
      
      if (status.includes('behind')) {
        spinner.text = 'Updates available, pulling...';
        execSync('git pull', { cwd: targetDir, stdio: 'pipe' });
        spinner.succeed('Updated to latest version');
        console.log('');
        log.info('Restart Cursor to load updated skills');
      } else {
        spinner.succeed('Already up to date');
      }
    } catch (error) {
      spinner.fail('Update failed');
      log.error(error.message);
    }
  });

program.parse();
