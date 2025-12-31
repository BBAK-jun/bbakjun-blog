#!/usr/bin/env node

/**
 * GitHub Actions Documentation Update Script
 *
 * This script orchestrates the feature-orchestrator agent to update
 * documentation based on code changes detected between commits.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  previousMain: process.env.PREVIOUS_MAIN,
  baseCommit: process.env.BASE_COMMIT,
  changedFiles: process.env.CHANGED_FILES?.split('\n') || [],
  targetApps: process.env.TARGET_APPS || 'all',
  forceUpdate: process.env.FORCE_UPDATE === 'true',
  docsDir: path.join(process.cwd(), '.claude', 'docs'),
};

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.bright}${colors.blue}[${step}]${colors.reset} ${message}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: options.stdio || 'inherit',
      ...options,
    });
  } catch (error) {
    log(`Command failed: ${command}`, 'red');
    throw error;
  }
}

function getChangedFilesWithHashes() {
  logStep('1', 'Detecting changed files with current blob hashes');

  const changedFiles = [];
  const changedFilesList = execSync(`git diff --name-only ${CONFIG.previousMain}...HEAD`, {
    encoding: 'utf-8',
  }).split('\n').filter(Boolean);

  // Exclude .claude/docs and .github
  const relevantFiles = changedFilesList.filter(
    file => !file.startsWith('.claude/docs/') && !file.startsWith('.github/')
  );

  for (const file of relevantFiles) {
    try {
      const currentHash = execSync(`git rev-parse HEAD:${file}`, {
        encoding: 'utf-8',
      }).trim();

      changedFiles.push({
        path: file,
        currentHash,
      });
    } catch {
      // File was deleted, skip
      log(`  - Skipped (deleted): ${file}`, 'yellow');
    }
  }

  log(`  Found ${changedFiles.length} changed files`, 'green');
  return changedFiles;
}

function loadExistingMetadata(appName) {
  const metadataPath = path.join(CONFIG.docsDir, 'facts', 'apps', appName, 'metadata.json');

  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      return metadata;
    } catch {
      return null;
    }
  }

  return null;
}

function needsUpdate(appName, changedFiles) {
  const metadata = loadExistingMetadata(appName);

  // No existing metadata - needs initial extraction
  if (!metadata) {
    log(`  ${appName}: No existing metadata - needs full extraction`, 'yellow');
    return { needsUpdate: true, reason: 'no-metadata' };
  }

  // Force update flag
  if (CONFIG.forceUpdate) {
    log(`  ${appName}: Force update enabled`, 'yellow');
    return { needsUpdate: true, reason: 'force' };
  }

  // Check if any source files changed
  const changedFileHashes = new Map(changedFiles.map(f => [f.path, f.currentHash]));

  for (const sourceFile of metadata.sourceFiles || []) {
    const currentHash = changedFileHashes.get(sourceFile.path);
    if (currentHash && currentHash !== sourceFile.gitHash) {
      log(`  ${appName}: File changed - ${sourceFile.path}`, 'yellow');
      return { needsUpdate: true, reason: 'file-changed', file: sourceFile.path };
    }
  }

  // Check git commit
  try {
    const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
    if (metadata.gitCommit !== currentCommit) {
      log(`  ${appName}: Different commit detected`, 'yellow');
      return { needsUpdate: true, reason: 'commit-diff' };
    }
  } catch {
    // Git check failed, assume update needed
    return { needsUpdate: true, reason: 'git-check-failed' };
  }

  log(`  ${appName}: No changes detected - skipping`, 'green');
  return { needsUpdate: false };
}

function createClaudeCodeAgentPrompt(appName, changedFiles) {
  const changedFilesList = changedFiles.map(f => f.path).join('\n');

  return {
    role: 'user',
    content: `${appName} 앱의 문서를 업데이트해줘.

## 변경사항 정보

- 이전 커밋: ${CONFIG.previousMain}
- 현재 커밋: ${CONFIG.baseCommit}
- 강제 업데이트: ${CONFIG.forceUpdate ? 'true' : 'false'}

## 변경된 파일

\`\`\`
${changedFilesList}
\`\`\`

## 요청사항

1. feature-orchestrator 에이전트의 워크플로우를 따라서 문서를 생성해줘
2. 변경된 파일만 기반으로 증분 업데이트를 수행해줘
3. 각 스테이지(facts, insights, specs)의 결과물을 \`.claude/docs/\` 디렉토리에 저장해줘
4. 기존 문서가 있다면 변경사항만 반영해줘`,
  };
}

async function runAgentForApp(appName, changedFiles) {
  const updateCheck = needsUpdate(appName, changedFiles);

  if (!updateCheck.needsUpdate) {
    return { status: 'skipped', reason: updateCheck.reason };
  }

  logStep('2', `Running feature-orchestrator for ${appName}`);

  // In CI environment, we need to call the agent via CLI
  // For now, we'll create a summary file that the agent can process
  const summaryPath = path.join(CONFIG.docsDir, `${appName}-update-request.json`);
  fs.writeFileSync(
    summaryPath,
    JSON.stringify({
      appName,
      changedFiles: changedFiles.filter(f => f.path.startsWith(`apps/${appName}/`) || f.path.startsWith('packages/')),
      previousMain: CONFIG.previousMain,
      baseCommit: CONFIG.baseCommit,
      timestamp: new Date().toISOString(),
    }, null, 2)
  );

  log(`  Created update request: ${summaryPath}`, 'green');

  // In a real CI environment, you would call the agent here
  // For GitHub Actions, we'll use a placeholder that logs what would happen
  log(`  NOTE: Agent execution would happen here in actual workflow`, 'yellow');

  return { status: 'success', path: summaryPath };
}

function determineTargetApps() {
  const targetApps = [];

  if (CONFIG.targetApps === 'all') {
    targetApps.push('blog', 'blog-admin');
  } else {
    targetApps.push(...CONFIG.targetApps.split(',').filter(Boolean));
  }

  // Check for rag-gateway
  if (fs.existsSync(path.join(process.cwd(), 'apps', 'rag-gateway'))) {
    if (CONFIG.targetApps === 'all' || CONFIG.targetApps.includes('rag-gateway')) {
      targetApps.push('rag-gateway');
    }
  }

  return targetApps;
}

async function main() {
  log('\n========================================', 'bright');
  log('  GitHub Actions Documentation Update', 'bright');
  log('========================================\n', 'bright');

  // Log configuration
  log('Configuration:', 'bright');
  log(`  Previous main: ${CONFIG.previousMain}`);
  log(`  Base commit: ${CONFIG.baseCommit}`);
  log(`  Target apps: ${CONFIG.targetApps}`);
  log(`  Force update: ${CONFIG.forceUpdate}`);
  log(`  Changed files: ${CONFIG.changedFiles.length}`);

  // Get changed files with hashes
  const changedFiles = getChangedFilesWithHashes();

  if (changedFiles.length === 0 && !CONFIG.forceUpdate) {
    log('\nNo changes detected. Exiting.', 'yellow');
    process.exit(0);
  }

  // Determine which apps to process
  const targetApps = determineTargetApps();
  log(`\nTarget apps: ${targetApps.join(', ')}`, 'blue');

  // Create docs directory structure
  const dirsToCreate = [
    path.join(CONFIG.docsDir, 'facts', 'apps'),
    path.join(CONFIG.docsDir, 'insights', 'apps'),
    path.join(CONFIG.docsDir, 'specs', 'apps'),
  ];

  for (const dir of dirsToCreate) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Process each app
  const results = {};

  for (const appName of targetApps) {
    const appFiles = changedFiles.filter(
      f => f.path.startsWith(`apps/${appName}/`) || f.path.startsWith('packages/')
    );

    try {
      results[appName] = await runAgentForApp(appName, appFiles);
    } catch (error) {
      log(`Failed to process ${appName}: ${error.message}`, 'red');
      results[appName] = { status: 'error', error: error.message };
    }
  }

  // Summary
  log('\n========================================', 'bright');
  log('  Summary', 'bright');
  log('========================================\n', 'bright');

  for (const [appName, result] of Object.entries(results)) {
    const statusIcon = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
    log(`  ${statusIcon} ${appName}: ${result.status}`);
    if (result.reason) {
      log(`      Reason: ${result.reason}`);
    }
    if (result.error) {
      log(`      Error: ${result.error}`, 'red');
    }
  }

  // Create summary file for GitHub Actions to read
  const summaryPath = path.join(CONFIG.docsDir, 'update-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    previousMain: CONFIG.previousMain,
    baseCommit: CONFIG.baseCommit,
    results,
  }, null, 2));

  log(`\nSummary written to: ${summaryPath}`, 'green');
}

main().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
