#!/bin/bash

# Local script to run Claude Code agent for documentation update
# This can be used for testing before pushing to GitHub

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Claude Code Agent - Local Runner${NC}"
echo -e "${BLUE}========================================${NC}"

# Get previous commit (main or user-specified)
PREVIOUS_COMMIT=${1:-$(git rev-parse main)}
CURRENT_COMMIT=$(git rev-parse HEAD)

echo -e "${YELLOW}Previous commit: ${PREVIOUS_COMMIT}${NC}"
echo -e "${YELLOW}Current commit:  ${CURRENT_COMMIT}${NC}"
echo -e "${YELLOW}Comparing: main...HEAD${NC}"

# Detect changed files (including uncommitted changes)
echo -e "\n${BLUE}Detecting changed files...${NC}"

# Get committed changes
COMMITTED_FILES=$(git diff --name-only "${PREVIOUS_COMMIT}...HEAD" | grep -v -E '^(\\.claude/docs/|\\.github/)' || echo "")

# Get uncommitted changes (staged + unstaged)
UNCOMMITTED_FILES=$(git diff --name-only main | grep -v -E '^(\\.claude/docs/|\\.github/)' || echo "")

# Combine and deduplicate
CHANGED_FILES=$(echo -e "${COMMITTED_FILES}\n${UNCOMMITTED_FILES}" | sort -u | grep -v '^$' || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo -e "${YELLOW}No changes detected. Exiting.${NC}"
    exit 0
fi

echo -e "${GREEN}Changed files:${NC}"
echo "$CHANGED_FILES"

# Determine target apps
TARGET_APPS=""

if echo "$CHANGED_FILES" | grep -q "^apps/blog/"; then
    TARGET_APPS="${TARGET_APPS}blog,"
fi

if echo "$CHANGED_FILES" | grep -q "^apps/blog-admin/"; then
    TARGET_APPS="${TARGET_APPS}blog-admin,"
fi

if [ -d "apps/rag-gateway" ] && echo "$CHANGED_FILES" | grep -q "^apps/rag-gateway/"; then
    TARGET_APPS="${TARGET_APPS}rag-gateway,"
fi

if echo "$CHANGED_FILES" | grep -q "^packages/"; then
    TARGET_APPS="${TARGET_APPS}all"
fi

# Remove trailing comma
TARGET_APPS=$(echo "$TARGET_APPS" | sed 's/,$//')

# Default to all if no specific apps detected
if [ -z "$TARGET_APPS" ]; then
    TARGET_APPS="all"
fi

echo -e "\n${GREEN}Target apps: ${TARGET_APPS}${NC}"

# Create prompt for Claude Code
cat > /tmp/claude-doc-update-prompt.md << EOF
# 문서 자동 업데이트 요청

main 브랜치에 머지된 변경사항을 기반으로 문서를 업데이트해주세요.

## 변경 정보

- 이전 커밋: \`${PREVIOUS_COMMIT}\`
- 현재 커밋: \`${CURRENT_COMMIT}\`

## 변경된 파일

\`\`\`
$(echo "$CHANGED_FILES")
\`\`\`

## 대상 앱

${TARGET_APPS}

## 요청사항

1. feature-orchestrator 에이전트의 워크플로우를 따라서 문서를 생성해주세요
2. 각 스테이지(facts, insights, specs)의 결과물을 \`.claude/docs/\` 디렉토리에 저장해주세요
3. 기존 문서가 있다면 변경사항만 반영하여 증분 업데이트를 수행해주세요

## feature-orchestrator 워크플로우

- Stage 1: codebase-extractor - 변경된 파일과 관련된 코드 구조 추출
- Stage 2: business-context-analyst - 비즈니스 컨텍스트 분석
- Stage 3: feature-spec-writer - 기능 명세서 작성

각 스테이지의 결과물은 다음 위치에 저장되어야 합니다:
- Facts: \`.claude/docs/facts/apps/<app-name>/\`
- Insights: \`.claude/docs/insights/apps/<app-name>/\`
- Specs: \`.claude/docs/specs/apps/<app-name>/\`
EOF

echo -e "\n${BLUE}Prompt created at: /tmp/claude-doc-update-prompt.md${NC}"
echo -e "${YELLOW}Copy the prompt and paste it into Claude Code${NC}"
echo -e "${YELLOW}Or use: claude-code --prompt /tmp/claude-doc-update-prompt.md${NC}"
