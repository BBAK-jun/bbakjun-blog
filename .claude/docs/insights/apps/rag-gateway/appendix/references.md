# RAG Gateway - References

- **Scope**: RAG Gateway 비즈니스 분석 참고문헌
- **Last Verified**: 2026-01-04
- **Repo Ref**: 628174858956a2b1ff3d7c33e4ae03c790ed3208

---

## Facts Documents

### RAG Gateway Facts
- **[Index](../../../facts/apps/rag-gateway/index.md)** - Overview, Architecture, Directory Structure
- **[API Endpoints](../../../facts/apps/rag-gateway/apis/index.md)** - All API Endpoints with Request/Response Schemas
- **[Configuration](../../../facts/apps/rag-gateway/config/index.md)** - Environment Variables, Security Settings, Rate Limiting
- **[Utilities & Services](../../../facts/apps/rag-gateway/utils/index.md)** - Services, Middleware, Core RAG Logic, Test Suite

### Other Apps Facts
- **[Blog Facts](../../../facts/apps/blog/index.md)** - Blog App Structure and Features
- **[Blog-Admin Facts](../../../facts/apps/blog-admin/index.md)** - Admin Dashboard and CDC Integration

---

## Insights Documents

### Executive Summary
- **[Executive Summary](../exec/summary.md)** - 경영진을 위한 핵심 요약

### Impact Analysis
- **[ROI Analysis](../impact/roi.md)** - 투자 대비 수익 분석 (테스팅 ROI, 개발 속도)
- **[Cost Analysis](../impact/cost.md)** - 다중 모델 지원 비용 분석
- **[Risk Reduction](../impact/risk.md)** - 테스팅을 통한 위험 감소 효과
- **[Customer Impact](../impact/customer.md)** - 고객 경험 개선 효과 (TODO)

### Stakeholder Analysis
- **[Stakeholder Mapping](../stakeholders/mapping.md)** - 이해관계자 매핑 및 영향

### Strategic Decisions
- **[Recommendations](../decisions/recommendations.md)** - 향후 RAG 개선 권장사항
- **[Tradeoffs](../decisions/tradeoffs.md)** - 기술적 트레이드오프 분석

### Appendix
- **[Assumptions](../appendix/assumptions.md)** - 분석 가정사항
- **[Needed Data](../appendix/needed-data.md)** - 추가로 필요한 데이터
- **[References](../appendix/references.md)** - 참고문헌 (본 문서)

---

## External References

### LLM & Embedding Pricing
- **[OpenAI Pricing](https://openai.com/pricing)** - GPT-4o-mini, text-embedding-3-small 가격
- **[Zhipu AI Pricing](https://open.bigmodel.cn/pricing)** - GLM-4.6, embedding-2 가격
- **[BAAI Models](https://huggingface.co/BAAI)** - bge-m3, bge-large-zh-v1.5 모델 정보

### Vector Database
- **[Qdrant Documentation](https://qdrant.tech/documentation/)** - Qdrant 벡터 데이터베이스 가이드
- **[Qdrant Cloud Pricing](https://qdrant.tech/cloud-pricing/)** - Qdrant Cloud 가격 정책

### Testing Best Practices
- **[Vitest Documentation](https://vitest.dev/)** - Vitest 테스트 프레임워크 가이드
- **[Testing Best Practices](https://testingjavascript.com/)** - JavaScript 테스트 베스트 프랙티스

### Business Analysis
- **[Software Engineering Economics](https://www.amazon.com/Software-Engineering-Economics-Prentice-Hall-Advances/dp/0138221220)** - Barry Boehm (1981)
- **[The ROI of Testing](https://www.stickyminds.com/article/roi-testing)** - 테스트 ROI 연구

### RAG Architecture
- **[Building RAG Applications](https://www.anthropic.com/index/build-with-claude/retrieval-augmented-generation)** - Anthropic RAG 가이드
- **[RAG Tutorial](https://github.com/langchain-ai/rag-from-scratch)** - LangChain RAG 튜토리얼

---

## Internal Documentation

### Project Documentation
- **[CLAUDE.md](../../../../../../CLAUDE.md)** - 프로젝트 전체 가이드
- **[CLAUDE.md - Testing](../../../../../../CLAUDE.md#testing)** - 테스트 작성 가이드라인

### Architecture Documents
- **[RAG Architecture](../../../../apps/rag-gateway/docs/RAG_ARCHITECTURE.md)** - RAG 아키텍처 상세
- **[Security Documentation](../../../../apps/rag-gateway/docs/SECURITY.md)** - 보안 가이드라인
- **[API Documentation](../../../../apps/rag-gateway/docs/API.md)** - API 스펙

---

## Research Papers

### RAG & LLM
- **"Retrieval-Augmented Generation for Large Language Models"** - Lewis et al. (2020)
- **"Language Models are Few-Shot Learners"** - Brown et al. (2020)

### Testing ROI
- **"A Spiral Model of Software Development and Enhancement"** - Barry Boehm (1988)
- **"The Economic Impacts of the Software Engineering Crisis"** - Barry Boehm (1976)

### Vector Search
- **"Efficient Dot-Product Kernels"** - Chen et al. (2023)
- **"Approximate Nearest Neighbor Search"** - Har-Peled et al. (2012)

---

## Tools & Frameworks

### Core Dependencies
- **[Hono](https://hono.dev/)** - Web Framework (v4.6.5)
- **[Vitest](https://vitest.dev/)** - Test Framework
- **[Qdrant JS Client](https://github.com/qdrant/qdrant-js)** - Vector DB Client
- **[OpenAI Node.js](https://github.com/openai/openai-node)** - OpenAI SDK

### Development Tools
- **[TypeScript](https://www.typescriptlang.org/)** - Programming Language
- **[pnpm](https://pnpm.io/)** - Package Manager
- **[Turborepo](https://turbo.build/repo)** - Monorepo Build System

### Monitoring & Observability
- **[Pino](https://getpino.io/)** - Logger
- **[Vercel Analytics](https://vercel.com/analytics)** - Web Analytics
- **[Sentry](https://sentry.io/)** - Error Tracking

---

## Community Resources

### Blogs & Articles
- **[RAG with LlamaIndex](https://docs.llamaindex.ai/)** - LlamaIndex RAG 튜토리얼
- **[Vector Search Explained](https://www.pinecone.io/learn/)** - Pinecone 블로그
- **[Embedding Models Guide](https://www.sbert.net/)** - Sentence Transformers 가이드

### Conferences & Talks
- **[Vector Database Conference](https://vectordbcon.com/)** - 벡터 데이터베이스 컨퍼런스
- **[AI Engineer Summit](https://www.ai.engineering/)** - AI 엔지니어링 서밋

---

## Standards & Best Practices

### API Design
- **[OpenAPI Specification](https://swagger.io/specification/)** - API 문서 표준
- **[RESTful API Design](https://restfulapi.net/)** - REST API 설계 가이드

### Security
- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)** - 웹 보안 리스크
- **[API Security Best Practices](https://oauth.net/2/)** - OAuth 2.0 보안

### Testing
- **[Testing Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)** - 테스트 피라미드
- **[Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)** - TDD 가이드

---

## Version Control

### Git History
- **Commit: 6281748** - "feat: add comprehensive test suite for RAG Gateway"
- **Branch: BBAK-jun/vaduz** - Current development branch

### Repository
- **Remote**: https://github.com/bbakjun-dev/vaduz
- **Clone URL**: git@github.com:bbakjun-dev/vaduz.git

---

## Citation Format

### Facts Documents
```markdown
See: [RAG Gateway Facts](../../../facts/apps/rag-gateway/index.md)
```

### Insights Documents
```markdown
See: [ROI Analysis](../impact/roi.md)
```

### External Resources
```markdown
See: [OpenAI Pricing](https://openai.com/pricing)
```

---

## Document Metadata

- **Created**: 2026-01-04
- **Last Updated**: 2026-01-04
- **Maintained By**: Business Context Analyst (Claude Code)
- **Version**: 2.0.0

---

## Changelog

### v2.0.0 (2026-01-04)
- Added comprehensive test suite analysis
- Added multi-model support cost analysis
- Added enhanced admin handler insights
- Updated all references to latest facts

### v1.0.0 (2024-12-26)
- Initial business insights documentation
- Added ROI, cost, risk analysis
- Added stakeholder mapping
