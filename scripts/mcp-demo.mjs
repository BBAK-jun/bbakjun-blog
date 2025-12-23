#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) 데모 스크립트
 * RAG 서비스의 MCP 기능을 테스트합니다
 */

import { getMCPClient } from '../packages/rag-core/dist/index.mjs';

async function runMCPDemo() {
  console.log('🚀 MCP Demo Starting...\n');

  // Get MCP client
  const mcpClient = getMCPClient('http://localhost:3002');

  try {
    // 1. Get available tools
    console.log('1️⃣ Available MCP Tools:');
    const tools = await mcpClient.getTools();
    tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // 2. Search blog content
    console.log('2️⃣ Searching blog content for "TypeScript"...');
    const searchResult = await mcpClient.searchBlogContent('TypeScript generics', {
      limit: 3
    });
    console.log('Search Results:');
    console.log(JSON.stringify(searchResult, null, 2));
    console.log('');

    // 3. Explain code
    console.log('3️⃣ Explaining React Hook code...');
    const codeExample = `
import { useState, useEffect } from 'react';

function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  return { count, increment, decrement };
}
    `;
    const explainResult = await mcpClient.explainCode(codeExample);
    console.log('Code Explanation:');
    console.log(JSON.stringify(explainResult, null, 2));
    console.log('');

    // 4. Find code examples
    console.log('4️⃣ Finding React examples...');
    const examplesResult = await mcpClient.findExamples('React');
    console.log('Code Examples:');
    console.log(JSON.stringify(examplesResult, null, 2));
    console.log('');

    // 5. Get related posts
    console.log('5️⃣ Getting posts related to "Next.js"...');
    const relatedPostsResult = await mcpClient.getRelatedPosts('Next.js');
    console.log('Related Posts:');
    console.log(JSON.stringify(relatedPostsResult, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure RAG Gateway is running:');
    console.log('   pnpm dev:rag');
  }
}

// Check if RAG service is running
async function checkRAGService() {
  try {
    const response = await fetch('http://localhost:3002/health');
    return response.ok;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log('Checking RAG service...');
  const isRunning = await checkRAGService();

  if (!isRunning) {
    console.error('❌ RAG Gateway is not running on http://localhost:3002');
    console.log('\nPlease start the RAG service first:');
    console.log('   pnpm docker:up');
    console.log('   pnpm dev:rag');
    process.exit(1);
  }

  console.log('✅ RAG Gateway is running!\n');
  await runMCPDemo();
}

main().catch(console.error);