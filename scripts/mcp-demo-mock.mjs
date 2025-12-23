#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) 데모 스크립트 - Mock Version
 * RAG 서비스의 MCP 기능을 시뮬레이션합니다
 */

console.log('🚀 MCP Demo Starting...\n');

// Mock MCP client for demonstration
class MockMCPClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async getTools() {
    console.log(`📡 Connecting to ${this.baseUrl}...`);
    console.log('⚠️  Using mock data - RAG Gateway is not running\n');

    return [
      {
        name: 'search_blog',
        description: 'Search blog content by query with semantic understanding'
      },
      {
        name: 'explain_code',
        description: 'Explain code snippets with context-aware analysis'
      },
      {
        name: 'find_examples',
        description: 'Find code examples for specific technologies or use cases'
      },
      {
        name: 'get_related_posts',
        description: 'Get related blog posts for a given topic'
      }
    ];
  }

  async searchBlogContent(query, options = {}) {
    const mockResults = {
      tool: 'search_blog',
      result: {
        query,
        matches: [
          {
            id: 'blog-1',
            title: 'TypeScript 제네릭 심화 학습',
            slug: 'DEV/typescript-generics-deep-dive',
            score: 0.95,
            snippet: 'TypeScript 제네릭은 타입을 매개변수처럼 사용할 수 있게 해주는 강력한 기능입니다...',
            metadata: {
              category: 'DEV',
              tags: ['TypeScript', 'Generics', 'Advanced'],
              author: 'bbakjun',
              publishedAt: '2024-12-15'
            }
          },
          {
            id: 'blog-2',
            title: 'Practical TypeScript Patterns',
            slug: 'DEV/typescript-practical-patterns',
            score: 0.87,
            snippet: '실무에서 자주 사용하는 TypeScript 패턴들을 정리해봅니다...',
            metadata: {
              category: 'DEV',
              tags: ['TypeScript', 'Patterns', 'Best-practices'],
              author: 'bbakjun',
              publishedAt: '2024-12-10'
            }
          }
        ],
        total: 2,
        search_time: '0.23s'
      },
      context: {
        timestamp: new Date().toISOString(),
        executionTime: 0.23
      }
    };

    return mockResults;
  }

  async explainCode(code, context) {
    const mockExplanation = {
      tool: 'explain_code',
      result: {
        explanation: '이 코드는 React 커스텀 훅(useCounter)을 구현한 것입니다.\n\n주요 기능:\n1. useState로 count 상태 관리\n2. useEffect로 count 변화 감지 및 로깅\n3. 증감(increment/decrement) 함수 제공\n4. 초기값 설정 가능\n\n이 패턴은 컴포넌트 간에 상태 로직을 공유할 때 유용합니다.',
        language: 'javascript',
        framework: 'React',
        patterns: ['Custom Hook', 'State Management', 'Side Effects'],
        best_practices: [
          'Custom Hook 이름은 use로 시작해야 함',
          '의존성 배열을 올바르게 사용해야 함',
          '관련된 상태와 함수들을 하나의 훅으로 묶어 재사용성 증가'
        ]
      },
      context: {
        timestamp: new Date().toISOString(),
        executionTime: 0.15
      }
    };

    return mockExplanation;
  }

  async findExamples(technology, useCase) {
    const mockExamples = {
      tool: 'find_examples',
      result: {
        technology,
        examples: [
          {
            title: 'React State Management with Context API',
            code: `const AppContext = createContext();

function AppProvider({ children }) {
  const [state, setState] = useState(initialState);

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
}`,
            use_case: 'Global state management',
            difficulty: 'Intermediate',
            tags: ['React', 'Context', 'State']
          },
          {
            title: 'Custom Hook for API Calls',
            code: `function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}`,
            use_case: 'API data fetching',
            difficulty: 'Beginner',
            tags: ['React', 'Hooks', 'API']
          }
        ],
        total: 2
      },
      context: {
        timestamp: new Date().toISOString(),
        executionTime: 0.31
      }
    };

    return mockExamples;
  }

  async getRelatedPosts(topic, limit = 3) {
    const mockRelatedPosts = {
      tool: 'get_related_posts',
      result: {
        topic,
        posts: [
          {
            id: 'post-1',
            title: 'Next.js 15 App Router 완전 정복',
            slug: 'DEV/nextjs-15-app-router-guide',
            excerpt: 'Next.js 15의 새로운 App Router와 Server Components에 대해 자세히 알아봅니다.',
            relevance_score: 0.92,
            metadata: {
              category: 'DEV',
              tags: ['Next.js', 'App Router', 'React'],
              publishedAt: '2024-12-20'
            }
          },
          {
            id: 'post-2',
            title: 'Next.js 성능 최적화 전략',
            slug: 'DEV/nextjs-performance-tips',
            excerpt: 'Next.js 애플리케이션의 성능을 최적화하는 다양한 방법들을 소개합니다.',
            relevance_score: 0.88,
            metadata: {
              category: 'DEV',
              tags: ['Next.js', 'Performance', 'Optimization'],
              publishedAt: '2024-12-18'
            }
          },
          {
            id: 'post-3',
            title: 'Vercel 배포 모범 사례',
            slug: 'DEV/vercel-deployment-guide',
            excerpt: 'Next.js 애플리케이션을 Vercel에 배포하는 모범 사례와 팁들을 공유합니다.',
            relevance_score: 0.75,
            metadata: {
              category: 'DEV',
              tags: ['Next.js', 'Vercel', 'Deployment'],
              publishedAt: '2024-12-12'
            }
          }
        ],
        total: 3,
        query_time: '0.18s'
      },
      context: {
        timestamp: new Date().toISOString(),
        executionTime: 0.18
      }
    };

    return mockRelatedPosts;
  }
}

async function runMCPDemo() {
  const mcpClient = new MockMCPClient('http://localhost:3002');

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
    `.trim();
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

    console.log('\n✅ MCP Demo completed successfully!');
    console.log('\n💡 To run with actual RAG service:');
    console.log('   1. Start Docker: docker-compose up -d');
    console.log('   2. Add API keys to .env.local');
    console.log('   3. Start RAG service: pnpm dev:rag');
    console.log('   4. Run real demo: node scripts/mcp-demo.mjs');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main execution
runMCPDemo().catch(console.error);