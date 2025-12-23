# RAG MCP (Model Context Protocol) Integration

## Overview

MCP integration allows AI assistants (like Claude Code) to interact with the blog's RAG system through standardized tools. This enables:

- **Content Search**: Search blog posts with semantic understanding
- **Code Explanation**: Get context-aware explanations of code snippets
- **Example Discovery**: Find code examples for specific technologies
- **Related Content**: Discover related blog posts for any topic

## MCP Tools Available

### 1. `search_blog`
Search blog content using semantic similarity

**Input**:
```json
{
  "query": "string",
  "category": "string (optional)",
  "tags": ["string"],
  "limit": "number"
}
```

**Output**:
```json
{
  "tool": "search_blog",
  "result": {
    "matches": [
      {
        "id": "string",
        "title": "string",
        "slug": "string",
        "score": "number",
        "snippet": "string",
        "metadata": {
          "category": "string",
          "tags": ["string"],
          "author": "string",
          "publishedAt": "string"
        }
      }
    ],
    "total": "number"
  }
}
```

### 2. `explain_code`
Get AI-powered code explanations with blog context

**Input**:
```json
{
  "code": "string",
  "context": "string (optional)"
}
```

**Output**:
```json
{
  "tool": "explain_code",
  "result": {
    "explanation": "string",
    "language": "string",
    "framework": "string (optional)",
    "patterns": ["string"],
    "best_practices": ["string"]
  }
}
```

### 3. `find_examples`
Discover code examples from blog posts

**Input**:
```json
{
  "technology": "string",
  "use_case": "string (optional)"
}
```

**Output**:
```json
{
  "tool": "find_examples",
  "result": {
    "technology": "string",
    "examples": [
      {
        "title": "string",
        "code": "string",
        "use_case": "string",
        "difficulty": "string",
        "tags": ["string"]
      }
    ]
  }
}
```

### 4. `get_related_posts`
Find blog posts related to a topic

**Input**:
```json
{
  "topic": "string",
  "limit": "number (optional)"
}
```

**Output**:
```json
{
  "tool": "get_related_posts",
  "result": {
    "topic": "string",
    "posts": [
      {
        "id": "string",
        "title": "string",
        "slug": "string",
        "excerpt": "string",
        "relevance_score": "number",
        "metadata": {
          "category": "string",
          "tags": ["string"],
          "publishedAt": "string"
        }
      }
    ]
  }
}
```

## Architecture

```
AI Assistant (Claude Code, etc.)
    ↓ MCP Protocol (JSON-RPC over HTTP)
    ↓
RAG Gateway (http://localhost:3002)
    ↓
┌─────────────────────────────────────┐
│  Qdrant (Vector Database)          │
│  ├── Document Chunks              │
│  └── Embeddings                   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  LLM Services                     │
│  ├── GLM-4.6 (Primary)           │
│  └── GPT-4o-mini (Fallback)       │
└─────────────────────────────────────┘
```

## Usage with Claude Code

### Method 1: Direct MCP Integration

Add to your MCP configuration (`.claude_code_config.json`):

```json
{
  "mcpServers": {
    "blog-rag": {
      "command": "node",
      "args": ["./scripts/mcp-server.js"],
      "env": {
        "RAG_GATEWAY_URL": "http://localhost:3002"
      }
    }
  }
}
```

### Method 2: Client Library Usage

```javascript
import { getMCPClient } from '@repo/rag-core';

const client = getMCPClient('http://localhost:3002');

// Search content
const results = await client.searchBlogContent('TypeScript generics');

// Explain code
const explanation = await client.explainCode(code, context);

// Find examples
const examples = await client.findExamples('React', 'state management');

// Get related posts
const related = await client.getRelatedPosts('Next.js', 5);
```

## Running the Demo

### Mock Demo (No Setup Required)

```bash
node scripts/mcp-demo-mock.mjs
```

### Full Demo (Requires Docker + API Keys)

1. **Start Docker services**:
```bash
docker-compose up -d
```

2. **Configure environment variables** (`.env.local`):
```env
GLM_API_KEY=your_glm_api_key
OPENAI_API_KEY=your_openai_api_key
```

3. **Start RAG Gateway**:
```bash
pnpm dev:rag
```

4. **Run the demo**:
```bash
node scripts/mcp-demo.mjs
```

## Implementation Details

### MCP Client (`packages/rag-core/src/mcp.ts`)

The MCP client provides:
- Type-safe API calls to RAG Gateway
- Built-in error handling and retries
- Context tracking for analytics
- Helper methods for common operations

### RAG Gateway Routes (`apps/rag-gateway/src/routes/rag/mcp.ts`)

MCP endpoints handle:
- Tool discovery (`/mcp/tools`)
- Tool invocation (`/mcp/invoke`)
- Specialized endpoints for each tool type

### Security Considerations

1. **API Key Management**: All LLM API keys are server-side only
2. **Rate Limiting**: Implemented at gateway level
3. **Input Validation**: All inputs validated with Zod schemas
4. **Context Boundaries**: Each request isolated with its own context

## Future Enhancements

1. **More Tools**:
   - `summarize_post`: Generate summaries for blog posts
   - `translate_content`: Translate content to other languages
   - `generate_outline`: Create blog post outlines
   - `check_plagiarism`: Check content originality

2. **Advanced Features**:
   - Streaming responses for long queries
   - Conversation memory for multi-turn interactions
   - Personalized recommendations based on user history
   - Integration with external APIs (GitHub, Stack Overflow)

3. **Performance**:
   - Response caching with Redis
   - Batch processing for multiple queries
   - Background processing for expensive operations
   - Optimized vector search with filters

## Troubleshooting

### Common Issues

1. **RAG Gateway not running**:
   - Check Docker: `docker-compose ps`
   - Check logs: `docker-compose logs rag-gateway`
   - Restart: `docker-compose restart rag-gateway`

2. **API Key errors**:
   - Verify `.env.local` has required keys
   - Check key validity and quotas
   - Ensure keys are properly exported to container

3. **Module resolution errors**:
   - Ensure packages are built: `pnpm build:rag-packages`
   - Check file extensions (.mjs vs .js)
   - Verify package.json exports configuration

### Debug Commands

```bash
# Check RAG Gateway health
curl http://localhost:3002/health

# Check available MCP tools
curl http://localhost:3002/mcp/tools

# Test MCP invocation
curl -X POST http://localhost:3002/mcp/invoke \
  -H "Content-Type: application/json" \
  -d '{"tool":"search_blog","arguments":{"query":"TypeScript"}}'
```

## Conclusion

The MCP integration makes the blog's content and code examples accessible to AI assistants in a standardized way. This enhances the developer experience by allowing natural language queries about the blog's content and enabling AI assistants to provide context-aware help based on the blog's knowledge base.