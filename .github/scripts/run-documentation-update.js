#!/usr/bin/env node

/**
 * GitHub Actions Documentation Update Script (z.ai API)
 *
 * This script orchestrates the documentation update process using z.ai's glm-4.7 API.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

/**
 * Find the latest documentation update tag
 * @returns {string|null} Latest tag commit or null if not found
 */
function findLatestDocTag() {
  try {
    // Fetch all tags matching docs/update-* pattern
    const tags = execCommand('git tag -l "docs/update-*"', { stdio: 'pipe' }).trim().split('\n').filter(Boolean);

    if (tags.length === 0) {
      log('No documentation tags found, falling back to HEAD~1', 'yellow');
      return null;
    }

    // Sort tags by version (run_number and timestamp)
    // Format: docs/update-{run_number}-{timestamp}
    const sortedTags = tags.sort((a, b) => {
      const aParts = a.match(/docs\/update-(\d+)-(\d+)/);
      const bParts = b.match(/docs\/update-(\d+)-(\d+)/);
      if (!aParts || !bParts) return 0;
      // Compare by run_number first, then timestamp
      if (aParts[1] !== bParts[1]) {
        return parseInt(bParts[1]) - parseInt(aParts[1]);
      }
      return parseInt(bParts[2]) - parseInt(aParts[2]);
    });

    const latestTag = sortedTags[0];
    const latestCommit = execCommand(`git rev-list -1 ${latestTag}`, { stdio: 'pipe' }).trim();

    log(`Found latest doc tag: ${latestTag} (${latestCommit})`, 'green');
    return latestCommit;
  } catch (error) {
    log(`Failed to find doc tag: ${error.message}`, 'yellow');
    return null;
  }
}

// Configuration
function getConfig() {
  // Try to find latest documentation tag
  const latestDocTag = findLatestDocTag();

  // Fall back to environment variable if tag not found
  const previousMain = latestDocTag || process.env.PREVIOUS_MAIN;

  const baseCommit = execCommand('git rev-parse HEAD', { stdio: 'pipe' }).trim();

  // Get changed files between previous doc update and current commit
  let changedFiles = [];
  if (previousMain) {
    try {
      const files = execCommand(`git diff --name-only ${previousMain}...HEAD`, { stdio: 'pipe' }).trim();
      changedFiles = files.split('\n').filter(Boolean);
      // Exclude .claude/docs and .github from changed files
      changedFiles = changedFiles.filter(f =>
        !f.startsWith('.claude/docs/') && !f.startsWith('.github/')
      );
    } catch (error) {
      log(`Failed to get changed files: ${error.message}`, 'yellow');
    }
  }

  return {
    previousMain,
    baseCommit,
    changedFiles: changedFiles.map(filePath => ({ path: filePath })),
    targetApps: process.env.TARGET_APPS || 'all',
    forceUpdate: process.env.FORCE_UPDATE === 'true',
    docsDir: path.join(process.cwd(), '.claude', 'docs'),
    zaiApiKey: process.env.ZAI_API_KEY,
    zaiApiBase: process.env.ZAI_API_BASE || 'https://open.bigmodel.cn/api/paas/v4/',
  };
}

const CONFIG = getConfig();

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

/**
 * Call z.ai glm-4.7 API
 */
async function callZaiAPI(messages, model = 'glm-4.7') {
  if (!CONFIG.zaiApiKey) {
    throw new Error('ZAI_API_KEY is not set');
  }

  const response = await fetch(`${CONFIG.zaiApiBase}chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.zaiApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`z.ai API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Read file content
 */
function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write file content
 */
function writeFileContent(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Extract codebase facts using z.ai
 */
async function extractCodebaseFacts(appName, changedFiles) {
  logStep('Stage 1', `Extracting codebase facts for ${appName}`);

  // Read relevant source files
  const fileContents = [];
  for (const file of changedFiles.slice(0, 10)) { // Limit to 10 files
    const content = readFileContent(path.join(process.cwd(), file.path));
    if (content) {
      fileContents.push(`### ${file.path}\n\`\`\`\n${content.substring(0, 3000)}\n\`\`\``);
    }
  }

  const prompt = `다음 코드베이스 변경사항을 분석하여 기술적 사실(facts)을 추출해주세요.

## 앱 이름
${appName}

## 변경된 파일
${changedFiles.map(f => f.path).join('\n')}

## 파일 내용 (일부)
${fileContents.join('\n\n')}

## 요청사항
1. 코드베이스 구조를 분석하고 기술적 사실을 추출해주세요
2. 페이지, API, 스키마, 컴포넌트 구조를 문서화해주세요
3. 변경사항의 영향을 받는 부분을 식별해주세요

## 출력 형식 (Markdown)
- 각 섹션을 명확한 헤딩으로 구분
- 코드 예제와 파일 경로 포함
- 테이블과 목록을 활용하여 가독성 향상`;

  const facts = await callZaiAPI([
    { role: 'system', content: '당신은 코드베이스를 분석하여 기술적 문서를 작성하는 전문가입니다.' },
    { role: 'user', content: prompt },
  ]);

  // Save facts
  const factsDir = path.join(CONFIG.docsDir, 'facts', 'apps', appName);
  writeFileContent(path.join(factsDir, 'index.md'), facts);

  // Save metadata
  writeFileContent(path.join(factsDir, 'metadata.json'), JSON.stringify({
    gitCommit: CONFIG.baseCommit,
    sourceFiles: changedFiles,
    extractedAt: new Date().toISOString(),
  }, null, 2));

  log(`  Facts saved to: ${factsDir}/index.md`, 'green');
  return facts;
}

/**
 * Analyze business context using z.ai
 */
async function analyzeBusinessContext(appName, facts) {
  logStep('Stage 2', `Analyzing business context for ${appName}`);

  const prompt = `다음 코드베이스 분석 결과(facts)를 기반으로 비즈니스 컨텍스트를 분석해주세요.

## 앱 이름
${appName}

## Facts (코드베이스 분석)
${facts.substring(0, 5000)}...

## 요청사항
1. 비즈니스 목표와 이해관계자를 식별해주세요
2. 사용자 워크플로우와 유스케이스를 분석해주세요
3. 개선 기회와 영향도를 평가해주세요

## 출력 형식 (Markdown)
- 실행 요약 (Executive Summary)
- 이해관계자 매핑
- 영향도 분석 (ROI, 비용, 리스크)
- 권장사항과 트레이드오프`;

  const insights = await callZaiAPI([
    { role: 'system', content: '당신은 비즈니스 컨텍스트를 분석하여 전략적 인사이트를 제공하는 전문가입니다.' },
    { role: 'user', content: prompt },
  ]);

  // Save insights
  const insightsDir = path.join(CONFIG.docsDir, 'insights', 'apps', appName);
  writeFileContent(path.join(insightsDir, 'index.md'), insights);

  log(`  Insights saved to: ${insightsDir}/index.md`, 'green');
  return insights;
}

/**
 * Generate feature specification using z.ai
 */
async function generateFeatureSpec(appName, facts, insights) {
  logStep('Stage 3', `Generating feature specification for ${appName}`);

  const prompt = `다음 facts와 insights를 기반으로 기능 명세서를 작성해주세요.

## 앱 이름
${appName}

## Facts
${facts.substring(0, 3000)}...

## Insights
${insights.substring(0, 3000)}...

## 요청사항
1. 기능 개요와 목표를 정의해주세요
2. 기술 아키텍처와 설계 결정을 문서화해주세요
3. API 계약과 데이터 모델을 명시해주세요
4. 구현 로드맵과 마일스톤을 제시해주세요
5. 테스트 전략과 수용 기준을 정의해주세요

## 출력 형식 (Markdown)
- 명확한 섹션 구분
- 코드 예제와 다이어그램 (텍스트 기반)
- 우선순위와 타임라인 포함`;

  const spec = await callZaiAPI([
    { role: 'system', content: '당신은 기능 명세서를 작성하는 기술 문서 전문가입니다.' },
    { role: 'user', content: prompt },
  ]);

  // Save spec
  const specDir = path.join(CONFIG.docsDir, 'specs', 'apps', appName);
  const timestamp = new Date().toISOString().split('T')[0];
  writeFileContent(path.join(specDir, `update-${timestamp}.md`), spec);

  log(`  Spec saved to: ${specDir}/update-${timestamp}.md`, 'green');
  return spec;
}

/**
 * Process single app
 */
async function processApp(appName, changedFiles) {
  logStep('Processing', `App: ${appName}`);

  try {
    // Stage 1: Extract facts
    const facts = await extractCodebaseFacts(appName, changedFiles);

    // Stage 2: Analyze business context
    const insights = await analyzeBusinessContext(appName, facts);

    // Stage 3: Generate spec
    const spec = await generateFeatureSpec(appName, facts, insights);

    return { status: 'success', appName };
  } catch (error) {
    log(`  Error processing ${appName}: ${error.message}`, 'red');
    return { status: 'error', appName, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  log('\n========================================', 'bright');
  log('  GitHub Actions Doc Update (z.ai)', 'bright');
  log('========================================\n', 'bright');

  // Log configuration
  log('Configuration:', 'bright');
  log(`  Previous: ${CONFIG.previousMain?.substring(0, 8)}`);
  log(`  Current:  ${CONFIG.baseCommit?.substring(0, 8)}`);
  log(`  Apps:     ${CONFIG.targetApps}`);
  log(`  Force:    ${CONFIG.forceUpdate}`);
  log(`  API:      ${CONFIG.zaiApiBase}`);

  // Determine target apps
  let targetApps = [];
  if (CONFIG.targetApps === 'all') {
    targetApps = ['blog', 'blog-admin'];
  } else {
    targetApps = CONFIG.targetApps.split(',').filter(Boolean);
  }

  if (fs.existsSync(path.join(process.cwd(), 'apps', 'rag-gateway'))) {
    if (CONFIG.targetApps === 'all' || CONFIG.targetApps.includes('rag-gateway')) {
      targetApps.push('rag-gateway');
    }
  }

  // Create docs directory
  const dirs = [
    path.join(CONFIG.docsDir, 'facts', 'apps'),
    path.join(CONFIG.docsDir, 'insights', 'apps'),
    path.join(CONFIG.docsDir, 'specs', 'apps'),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Process each app
  const results = {};
  let hasActualUpdates = false; // Track if any app was actually processed (not skipped)
  for (const appName of targetApps) {
    const appFiles = CONFIG.changedFiles.filter(
      f => f.path.startsWith(`apps/${appName}/`) || f.path.startsWith('packages/')
    );

    if (appFiles.length === 0 && !CONFIG.forceUpdate) {
      results[appName] = { status: 'skipped', reason: 'no changes' };
      log(`  Skipping ${appName}: no changes`, 'yellow');
      continue;
    }

    const result = await processApp(appName, appFiles);
    results[appName] = result;

    // Mark that we have actual updates if processing was successful
    if (result.status === 'success') {
      hasActualUpdates = true;
    }
  }

  // Summary
  log('\n========================================', 'bright');
  log('  Summary', 'bright');
  log('========================================\n', 'bright');

  for (const [appName, result] of Object.entries(results)) {
    const icon = result.status === 'success' ? '✅' : result.status === 'skipped' ? '⏭️' : '❌';
    log(`  ${icon} ${appName}: ${result.status}`);
    if (result.error) log(`      ${result.error}`, 'red');
  }

  // Check if all apps were skipped (no actual documentation updates)
  if (!hasActualUpdates) {
    log('\n⏭️ All apps skipped - no documentation changes needed', 'yellow');
    log('Exiting without creating PR...\n', 'yellow');
    process.exit(0); // Exit with success but workflow can detect no changes
  }

  // Save summary
  const summaryPath = path.join(CONFIG.docsDir, 'update-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    previousMain: CONFIG.previousMain,
    baseCommit: CONFIG.baseCommit,
    results,
    hasActualUpdates,
  }, null, 2));

  log(`\nSummary: ${summaryPath}`, 'green');
}

main().catch(error => {
  log(`\nFatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
