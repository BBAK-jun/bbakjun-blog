# RAG Gateway - Cost Analysis

- **Scope**: apps/rag-gateway - Infrastructure & Operational Costs
- **Based on Facts**:
  - [../../../facts/apps/rag-gateway/config/index.md](../../../facts/apps/rag-gateway/config/index.md)
  - [../../../facts/apps/rag-gateway/apis/index.md](../../../facts/apps/rag-gateway/apis/index.md)
- **Last Verified**: 2025-12-29
- **Repo Ref**: bbakjun-blog monorepo

---

## Executive Summary

RAG Gateway has **$25-50/month fixed infrastructure costs** (Render Free + Qdrant) or **$45-100/month** (Vercel Pro + Qdrant), plus **$0.000012/query variable costs** (GLM). Multi-LLM strategy reduces Korean content costs by 95%. **Render deployment option saves $20-50/month** in hosting costs.

## Facts

### Fixed Infrastructure Costs

**Deployment Options**:

| Option | Provider | Tier | Monthly Cost | Notes |
|--------|----------|------|--------------|-------|
| **Render Free** | Render | Free Web Service | $0 | 750h/month, 15min sleep |
| **Qdrant Cloud** | Qdrant | 1GB Starter | $25-50 | Vector storage |
| **Redis (optional)** | Vercel KV | Basic | $0.20-10 | Rate limiting |
| **Vercel Pro** | Vercel | Pro | $20-40 | Alternative to Render |
| **Total (Render)** | | | **$25-50** | New deployment option |
| **Total (Vercel)** | | | **$45-100** | Original deployment |

**Key Changes** (2025-12-29):
- **New**: Render Free tier deployment option ($0 hosting)
- **Updated**: GLM API key now required (was optional)
- **Removed**: SiliconFlow provider (cost reduction)

---

### Variable Costs Per Query

#### OpenAI (Default)

| Component | Model | Price | Usage | Cost |
|-----------|-------|-------|-------|------|
| Embedding | text-embedding-3-small | $0.02/1M tokens | 100 tokens | $0.000002 |
| LLM Input | gpt-4o-mini | $0.15/1M tokens | 500 tokens | $0.000075 |
| LLM Output | gpt-4o-mini | $0.60/1M tokens | 300 tokens | $0.000180 |
| **Total** | | | | **$0.000257/query** |

#### GLM (Korean Optimized)

| Component | Model | Price | Usage | Cost |
|-----------|-------|-------|-------|------|
| Embedding | text-embedding-3-small | $0.02/1M tokens | 100 tokens | $0.000002 |
| LLM Input | glm-4.6 | $0.005/1M tokens | 500 tokens | $0.0000025 |
| LLM Output | glm-4.6 | $0.025/1M tokens | 300 tokens | $0.0000075 |
| **Total** | | | | **$0.000012/query** |

**Savings**: GLM costs **95.3% less** than OpenAI per query.

### Rate Limiting (Cost Cap)

**Source**: [config/index.md](../../../facts/apps/rag-gateway/config/index.md#rate-limiting-configuration)

| Limit Type | Requests | Window | Monthly Max |
|------------|----------|--------|-------------|
| Standard | 60 | 60 seconds | 2,592,000 |
| Health Check | 30 | 60 seconds | 1,296,000 |

**Effective cap**: ~2.6M queries/month (standard limit applied 24/7)

**Maximum Monthly Cost**:
- GLM: 2.6M * $0.000012 + $70 fixed = **$31 + $70 = $101**
- OpenAI: 2.6M * $0.000257 + $70 fixed = **$668 + $70 = $738**

### Storage Costs

**Qdrant Storage**: 1GB included in starter tier.

**Estimated capacity**:
- 1 chunk ≈ 1,200 characters ≈ 3KB (vector + metadata)
- 1GB ≈ 340,000 chunks
- 100 posts × 20 chunks/post = 2,000 chunks ≈ 6MB

**Conclusion**: 1GB tier sufficient for ~10,000+ blog posts.

---

## Key Insights (Interpretation)

### 1. Economies of Scale Favor Higher Query Volumes

**Cost per query decreases as volume increases** (amortizing fixed costs):

| Queries/Month | Fixed Cost/Query | Variable Cost (GLM) | Total Cost/Query |
|---------------|------------------|---------------------|------------------|
| 1,000 | $0.07 | $0.000012 | $0.070 |
| 10,000 | $0.007 | $0.000012 | $0.007 |
| 100,000 | $0.0007 | $0.000012 | $0.0007 |

**Business Impact**: At 100k queries/month, RAG Gateway costs ~$0.0007 per query (~$70/month total).

### 2. GLM Break-even vs OpenAI

**At what query volume does GLM save money?**

- OpenAI fixed + variable = $70 + ($0.000257 × queries)
- GLM fixed + variable = $70 + ($0.000012 × queries)
- Difference = $0.000245 per query

**Break-even**: Immediately. GLM is cheaper for any query volume > 0.

**Annual savings at 100k queries/month**:
- OpenAI: $70 + $25.70 = $95.70/month × 12 = **$1,148/year**
- GLM: $70 + $1.20 = $71.20/month × 12 = **$854/year**
- Savings: **$294/year (26% reduction)**

### 3. Rate Limiting Provides Billing Protection

**Worst-case scenario** (maximum abuse):
- Attacker sends 60 req/min = 86,400/day = 2.6M/month
- GLM cost: 2.6M × $0.000012 = $31 + $70 = **$101/month**
- OpenAI cost: 2.6M × $0.000257 = $668 + $70 = **$738/month**

**Mitigation**: Set Vercel spending limit at $200/month to prevent runaway costs.

### 4. Embedding Cache Reduces API Usage

**Cache effectiveness**:
- 90% cache hit rate → 10% of queries generate new embeddings
- 1,000 queries → 100 embedding API calls
- Savings: 900 × $0.000002 = $0.0018/month (small, but adds up)

**More valuable benefit**: Latency reduction (cache hit: ~1ms vs API: ~500ms)

### 5. Multi-LLM Strategy Enables Cost Optimization

**Hybrid approach** (not yet implemented):
- Use GLM for Korean queries (95% cheaper)
- Use OpenAI for English queries (higher quality)
- Estimated savings: 70-80% vs OpenAI-only

**Implementation needed**: Language detection + routing logic.

---

## Cost Optimization Strategies

### 1. Enable GLM for Production

**Action**: Set `LLM_PROVIDER=glm` in environment variables.

**Expected savings**:
- 10k queries/month: $29 → $3/month
- 100k queries/month: $290 → $30/month
- 1M queries/month: $2,900 → $290/month

**Risk**: Answer quality not yet validated (needs A/B testing).

### 2. Implement Request Batching

**Current**: One query = one API call.

**Optimization**: Batch multiple queries:
- 10 queries batched = 1 API call
- Reduces API overhead (not token cost, but latency)

**Trade-off**: Increased response latency for batched queries.

### 3. Add Response Caching

**Cache identical queries**:
- Redis cache with 1-hour TTL
- Key: SHA-256(query)
- Expected hit rate: 30-50%

**Savings**:
- 10k queries/month, 40% cache hit = 4k cached responses
- Savings: 4,000 × $0.000012 = $0.05/month (small)
- **Primary benefit**: Latency reduction, not cost

### 4. Optimize Token Usage

**Current assumption**: 500 input + 300 output tokens per query.

**Optimization strategies**:
- Truncate retrieved chunks to 2,000 characters (from 5,000)
- Use more concise system prompts
- Implement max token limits

**Potential savings**: 20-30% token reduction = 20-30% cost reduction.

### 5. Monitor and Alert on Cost Anomalies

**Set up alerts**:
- Daily cost > $10 (unusual spike)
- Weekly cost > $50 (abuse detection)
- Monthly cost > $100 (budget warning)

**Action**: Automatic throttling or shutdown when limits exceeded.

---

## Cost Comparison: Deployment Options

### Render Free Tier (New - 2025-12-29)

| Component | Cost | Notes |
|-----------|------|-------|
| Render Web Service | $0 | 750h/month, 15min sleep |
| Qdrant Cloud 1GB | $25-50/month | Managed service |
| Redis (optional) | $0.20-10/month | Rate limiting |
| Variable costs | $1-30/month | At 10k-100k queries |
| **Total** | **$26-80/month** | Zero hosting cost |

**Pros**:
- Free hosting (saves $20-40/month)
- Simple `render.yaml` configuration
- Auto-deploy on git push

**Cons**:
- 15min sleep mode (cold start ~30s)
- No persistent storage (cleanup script unavailable)
- 512MB RAM limit

**Workarounds**:
- Use cron-job.org or UptimeRobot to prevent sleep
- Use `DELETE /api/admin/collection` for full cleanup

### Vercel Pro (Original)

| Component | Cost | Notes |
|-----------|------|-------|
| Vercel Pro hosting | $20-40/month | Serverless |
| Qdrant Cloud 1GB | $25-50/month | Managed service |
| Redis (Vercel KV) | $0.20-10/month | Shared |
| Variable costs | $1-30/month | At 10k-100k queries |
| **Total** | **$46-130/month** | Zero maintenance |

**Pros**:
- No sleep mode (always on)
- Full Vercel ecosystem integration
- Better performance (edge functions)

**Cons**:
- $20-40/month hosting fee
- More complex deployment setup

### Self-Hosted Alternative (For Reference)

| Component | Cost | Notes |
|-----------|------|-------|
| VPS (4GB RAM, 2 CPU) | $20-40/month | Hetzner, DigitalOcean |
| Qdrant self-hosted | $0 (included in VPS) | |
| GPU for embedding (optional) | $100-300/month | If running local models |
| Maintenance time | 10 hours/month | Updates, monitoring |
| **Total** | **$120-340/month** | Excludes maintenance labor |

### Managed (RAG Gateway)

| Component | Cost | Notes |
|-----------|------|-------|
| Qdrant Cloud 1GB | $25-50/month | Managed service |
| Redis (Vercel KV) | $0.20-10/month | Shared |
| Vercel Pro hosting | $20-40/month | Serverless |
| Variable costs | $1-30/month | At 10k-100k queries |
| **Total** | **$46-130/month** | Zero maintenance |

**Conclusion**: Render Free tier is **40-50% cheaper** than Vercel Pro ($26-80 vs $46-130/month), with the trade-off of sleep mode and no persistent storage. Managed solutions are **40-60% cheaper** than self-hosting + eliminate maintenance overhead.

---

## Operational Efficiency Improvements

### New Features (2025-12-29)

**Stale Document Cleanup**:
- **Script**: `scripts/cleanup-stale-docs.ts`
- **Purpose**: Removes Qdrant documents that no longer exist in `.claude/docs/`
- **Impact**: Reduces database bloat, improves search relevance
- **Limitation**: Requires persistent filesystem (not available on Render Free)

**Admin Collection Delete API**:
- **Endpoint**: `DELETE /api/admin/collection`
- **Purpose**: Full collection reset for reindexing
- **Use Case**: Clean slate reindexing, migration, testing
- **Alternative to cleanup script** on Render

---

## Recommendations

### Deployment Choice

1. **Choose Render Free Tier for Cost Savings**
   - Saves $20-50/month vs Vercel Pro
   - Use UptimeRobot or cron-job.org to prevent sleep mode
   - Accept 30s cold start penalty
   - **Best for**: Low-traffic blogs, development, testing

2. **Choose Vercel Pro for Production**
   - No sleep mode, consistent performance
   - Better integration with blog/blog-admin apps
   - **Best for**: High-traffic blogs, production use

### Cost Optimization

3. **Deploy with GLM Provider**
   - Set `LLM_PROVIDER=glm` and `GLM_API_KEY`
   - GLM API key is now **required** (not optional)
   - A/B test quality for 1-2 weeks
   - If quality acceptable, switch 100% to GLM

4. **Set Budget Alerts**
   - Vercel/Render spending limit: $100/month
   - Daily anomaly alert: $10/day
   - OpenAI API usage alert (if using hybrid)

5. **Monitor Cache Effectiveness**
   - Track embedding cache hit rate
   - Add Redis-based distributed cache
   - Target >80% hit rate

6. **Optimize Token Usage**
   - Truncate source chunks to 2,000 characters
   - Use concise system prompts
   - Set max token limits: 1000 input, 500 output

7. **Consider Response Caching**
   - Cache identical queries for 1 hour
   - Expected 30-50% hit rate
   - Reduces latency more than cost

---

## Risk/Opportunity Assessment

### Cost Reduction Opportunities

| Opportunity | Monthly Savings | Confidence | Effort |
|-------------|-----------------|------------|--------|
| GLM adoption | $20-260 | High (95% cost reduction) | Low |
| Token optimization | $6-87 | Medium (20-30% reduction) | Medium |
| Response caching | $1-15 | Low (small impact) | Low |

### Cost Increase Risks

| Risk | Potential Impact | Probability | Mitigation |
|------|------------------|-------------|------------|
| Query volume spike | +$50-200/month | Medium | Rate limiting |
| OpenAI price increase | +10-20% | Low | GLM fallback |
| Qdrant overage | +$20-50/month | Low | Monitor storage |

---

## Assumptions

1. **Query distribution**: 100 input tokens (query) + 400 input tokens (context) + 300 output tokens = 800 tokens/query
2. **Cache hit rate**: 90% for embeddings, 40% for responses
3. **Query volume**: 1,000-100,000 queries/month (typical blog)
4. **Qdrant storage**: 1GB sufficient for ~10,000 posts
5. **GLM quality**: Equivalent to OpenAI for Korean content (unvalidated)

---

## Needed Data

To improve cost analysis, collect:

1. **Actual query metrics**
   - Average tokens per query (input + output)
   - Query volume by day/week
   - Cache hit rates (embedding, response)

2. **Cost baselines**
   - Current infrastructure costs without RAG
   - Labor cost for maintenance (if self-hosted)
   - Opportunity cost of poor search

3. **Quality metrics**
   - GLM vs OpenAI answer quality (A/B test)
   - User satisfaction by provider
   - Hallucination rates

4. **Usage patterns**
   - Peak query hours
   - Query intent distribution
   - Language distribution (Korean vs English)

---

## References

- [Facts: LLM Models](../../../facts/apps/rag-gateway/config/index.md#llm-models)
- [Facts: Embedding Models](../../../facts/apps/rag-gateway/config/index.md#embedding-models)
- [Facts: Rate Limiting](../../../facts/apps/rag-gateway/config/index.md#rate-limiting-configuration)
- [Facts: Qdrant Configuration](../../../facts/apps/rag-gateway/config/index.md#qdrant-configuration)
