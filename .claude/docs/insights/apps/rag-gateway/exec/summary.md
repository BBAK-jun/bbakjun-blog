# RAG Gateway - Executive Summary

- **Scope**: apps/rag-gateway - RAG (Retrieval-Augmented Generation) API Service
- **Based on Facts**:
  - [../../facts/apps/rag-gateway/index.md](../../facts/apps/rag-gateway/index.md)
  - [../../facts/apps/rag-gateway/apis/index.md](../../facts/apps/rag-gateway/apis/index.md)
- **Last Verified**: 2025-12-29
- **Repo Ref**: bbakjun-blog monorepo

---

## Business Purpose

RAG Gateway is an intelligent content search and Q&A API service that transforms DEV_BBAK blog from a static content repository into an interactive knowledge base. It combines vector similarity search with large language model (LLM) generation to provide contextually relevant answers based on blog content.

## Core Value Proposition

### Problem Statement

Traditional keyword search has limitations for technical blogs:
- **Exact-match dependency**: Fails to find related content using different terminology
- **No semantic understanding**: Cannot distinguish between "how to" vs "why" queries
- **Manual navigation required**: Users must read multiple posts to find answers
- **No synthesis**: Cannot combine information from multiple sources

### Solution

RAG Gateway delivers:
- **Semantic search**: Finds content by meaning, not just keywords
- **AI-generated answers**: Synthesizes information from multiple sources into coherent responses
- **Source attribution**: Cites original blog posts for verification and further reading
- **Multi-lingual support**: Korean-optimized embeddings (SiliconFlow BAAI/bge-m3) and GLM LLM option
- **Cost optimization**: Multi-LLM strategy (OpenAI vs GLM) balances quality and cost

## Target Users

### Primary Users

1. **Blog Readers (End Users)**
   - Developers seeking technical solutions
   - Learners researching specific technologies
   - Users asking natural language questions

2. **Content Owner (Blog Author)**
   - Improves content discoverability
   - Reduces repetitive questions
   - Provides analytics on what users search for

3. **Technical Operators**
   - Admin dashboard users (blog-admin)
   - DevOps maintaining the service

## Key Features

### Search & Q&A Capabilities

- **POST /api/rag/query**: Full RAG pipeline with AI-generated answers
- **POST /api/rag/search**: Vector similarity search without LLM generation
- **Query intent classification**: search, explain, how_to, troubleshoot, best_practices
- **Filters**: category, tags, author, date range, source

### Content Management

- **Automatic ingestion**: Fetches MDX posts from Vercel Blob Storage via CDC
- **Semantic chunking**: Respects document structure (headings, code blocks)
- **Batch processing**: Configurable batch size (default: 10 documents)
- **Incremental updates**: Skips unchanged documents unless forced

### Security & Reliability (Production-Ready)

- **P0 Security**: API Key authentication (X-RAG-API-Key header)
- **P1 Security**: Prompt injection detection and prevention
- **P2 Security**:
  - Rate limiting (60 req/min authenticated, 10 req/min public)
  - Sensitive data redaction (email, API keys, tokens)
  - Security headers (CSP, HSTS, X-Frame-Options)

### Observability

- **Health checks**: Component-level health monitoring (Qdrant, LLM, Redis)
- **Usage analytics**: Query stats, token usage, average response times
- **Audit logging**: Request/response logging with Pino structured logs

## Technical Architecture

### Multi-LLM Strategy (Cost Optimization)

| Provider | Model | Input Cost | Output Cost | Use Case |
|----------|-------|------------|-------------|----------|
| OpenAI | gpt-4o-mini | $0.15/M tokens | $0.60/M tokens | Default, high quality |
| GLM | glm-4.6 | $0.005/M tokens | $0.025/M tokens | Korean optimized, 30x cheaper |

**Business Impact**: GLM reduces LLM costs by ~97% while maintaining quality for Korean content.

### Vector Database (Qdrant)

- **Collection**: `blog_documents`
- **Embedding model**: text-embedding-3-small (1536 dimensions, OpenAI) or BAAI/bge-m3 (1024 dimensions, multilingual)
- **Similarity**: Cosine distance
- **Indexed fields**: documentId, category, tags, author, source, publishedAt

### Integration Points

1. **Blog-Admin (via Hono RPC)**
   - Fetches blob file list from CDC cache
   - Reduces Blob API calls by ~99% (vs direct listing)

2. **Blog App (via REST API)**
   - Client-side search UI (planned)
   - OpenAI-compatible API interface

3. **MCP Tools (Model Context Protocol)**
   - `search_blog`: Semantic blog search
   - `explain_code`: Code explanation with context
   - `find_examples`: Technology-specific examples
   - `get_related_posts`: Related content discovery

## Cost Structure

### Variable Costs (Per Query)

| Component | Cost Driver | Estimated Cost |
|-----------|-------------|----------------|
| Embedding | Tokens processed | $0.00002 per query (OpenAI) |
| Vector Search | Qdrant compute | $0 (self-hosted) |
| LLM Generation | Input + output tokens | $0.0003 per query (gpt-4o-mini) |

**Total**: ~$0.0003 per RAG query (OpenAI) or ~$0.00001 per query (GLM)

### Fixed Costs

| Service | Monthly Cost |
|---------|--------------|
| Qdrant Cloud (1GB) | ~$25-50/month |
| Redis (Vercel KV) | ~$0.20-10/month (usage-based) |

## Business Metrics to Track

### Engagement Metrics

- **Query volume**: Daily/weekly RAG queries
- **Answer relevance**: User feedback on generated answers
- **Source click-through**: Rate of users navigating to source posts

### Operational Metrics

- **Average query time**: Target < 3 seconds (embedding + search + LLM)
- **Cache hit rate**: Embedding cache effectiveness
- **Error rate**: Failed queries, timeouts

### Cost Metrics

- **Cost per query**: LLM + embedding costs
- **Token efficiency**: Average tokens per query
- **Provider mix**: OpenAI vs GLM usage ratio

## Strategic Alignment

### Short-Term (0-3 months)

- Improve content discoverability for existing blog posts
- Reduce author's time answering repetitive questions
- Gather query analytics to identify content gaps

### Medium-Term (3-6 months)

- Integrate AI-powered search into blog UI
- Add conversation memory for follow-up questions
- Expand to multilingual support (Korean + English)

### Long-Term (6-12 months)

- Monetization potential: API as service for other blogs
- Personalization: User-specific search history and recommendations
- Advanced features: Image-based search, code-specific queries

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucination | High (misinformation) | Source citation + confidence scores |
| API cost overruns | Medium (budget) | Rate limiting + GLM fallback |
| Data freshness | Medium (outdated answers) | Automatic reindexing on blob upload |
| Security vulnerabilities | High (unauthorized access) | P0/P1/P2 security implementation |
| Qdrant downtime | Medium (search unavailable) | Health checks + graceful degradation |

## Recommendations

1. **Enable GLM for Korean queries**: Reduces LLM costs by ~97% while maintaining quality
2. **Implement query analytics**: Track search patterns to identify content gaps
3. **Add user feedback**: Thumbs up/down on AI answers to improve relevance
4. **Set up cost alerts**: Monitor LLM API usage to prevent bill surprises
5. **Document integration**: Add AI search to blog UI for end-user discovery

## Needed Data (Missing Inputs)

The following data would improve business analysis:

- **Current search analytics**: Blog search query logs (if keyword search exists)
- **Content ingestion rate**: Number of posts and frequency of updates
- **User traffic**: Daily active users, search intent distribution
- **Cost baselines**: Current infrastructure costs without RAG
- **User feedback**: Satisfaction scores with existing content discovery

---

## References

- [Facts: RAG Gateway Overview](../../facts/apps/rag-gateway/index.md)
- [Facts: API Endpoints](../../facts/apps/rag-gateway/apis/index.md)
- [Facts: Configuration](../../facts/apps/rag-gateway/config/index.md)
- [Facts: Utilities & Services](../../facts/apps/rag-gateway/utils/index.md)
