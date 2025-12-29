# RAG Gateway - Stale Document Cleanup

- **Feature**: 자동 오래된 문서 정리
- **Based on Facts**:
  - [../../facts/apps/rag-gateway/index.md](../../facts/apps/rag-gateway/index.md)
  - [../../facts/apps/rag-gateway/utils/index.md](../../facts/apps/rag-gateway/utils/index.md)
  - [../../facts/apps/rag-gateway/apis/index.md](../../facts/apps/rag-gateway/apis/index.md)
- **Based on Insights**:
  - [../../insights/apps/rag-gateway/impact/cost.md](../../insights/apps/rag-gateway/impact/cost.md)
- **Created**: 2025-12-29
- **Status**: Implemented

---

## 개요

파일시스템에 존재하지 않는 문서(stale documents)를 Qdrant 벡터 데이터베이스에서 자동으로 삭제하는 유틸리티 스크립트입니다. 문서 구조 변경, 앱 삭제, 리팩토링 후 데이터베이스 정리에 사용됩니다.

### 문제 정의

**기존 문제**:
- 문서 삭제 후 Qdrant에 잔존하는 벡터 데이터
- 검색 결과에 존재하지 않는 문서 표시
- 데이터베이스 용량 낭비, 검색 품질 저하

**해결 방안**:
- `.claude/docs/` 파일시스템과 Qdrant 문서 비교
- 존재하지 않는 문서 자동 삭제
- 일관된 검색 결과 보장

---

## 기술 사양

### 1. 스크립트 구조

**파일**: `apps/rag-gateway/scripts/cleanup-stale-docs.ts`

```typescript
// 주요 컴포넌트
interface DocFile {
  path: string;    // 파일시스템 경로
  slug: string;    // 문서 slug (예: "facts/apps/rag-gateway/index.md")
}

interface QdrantDocument {
  id: string;
  slug: string;
  title: string;
}

// 작업 단계
function getMarkdownFiles(dir: string): DocFile[]           // 1. 파일시스템 스캔
async function getQdrantDocuments(): Promise<QdrantDocument[]>  // 2. Qdrant 조회
async function deleteDocument(id: string): Promise<boolean>  // 3. 문서 삭제
async function main(): Promise<void>                         // 4. 전체 실행
```

### 2. Slug 생성 규칙

**파일 경로 → Slug 매핑**:

| 파일 경로 | Slug |
|-----------|------|
| `.claude/docs/facts/apps/rag-gateway/index.md` | `facts/apps/rag-gateway/index` |
| `.claude/docs/insights/apps/blog/exec/summary.md` | `insights/apps/blog/exec/summary` |
| `.claude/docs/specs/apps/rag-gateway/render-deployment.md` | `specs/apps/rag-gateway/render-deployment` |

**코드**:
```typescript
const slug = fullPath.replace(baseDir + '/', '').replace('.md', '');
```

### 3. 필터링 규칙

**처리 대상 Slug**:
- `facts/apps/*` - Facts 문서
- `insights/apps/*` - Insights 문서
- `specs/apps/*` - Specs 문서

**제외 대상**:
- 블로그 게시물 (`posts/*`)
- 기타 콘텐츠

**코드**:
```typescript
if (
  !doc.slug.startsWith('facts/apps/') &&
  !doc.slug.startsWith('insights/apps/') &&
  !doc.slug.startsWith('specs/apps/')
) {
  continue; // 스킵
}
```

---

## 사용자 시나리오

### 시나리오 1: 일반 정리 (로컬 개발)

```bash
# 1. 환경 변수 설정
export RAG_GATEWAY_URL=http://localhost:3002

# 2. 스캔 및 분석 실행
cd apps/rag-gateway
node scripts/cleanup-stale-docs.ts

# 3. 결과 확인
# 🔍 Scanning .claude/docs for markdown files...
# 📁 Found 125 markdown files
# ✅ Built index of 125 unique documents
#
# 📥 Fetching documents from Qdrant...
# 📊 Qdrant has 150 documents
#
# 🗑️  Found 25 stale documents:
#   - facts/apps/old-app/index.md (Old App Documentation)
#   - insights/apps/deprecated-feature/impact/roi.md (Deprecated Feature)
#
# ⚠️  This will DELETE the above documents from Qdrant.
# Run with --yes or -y to confirm.
```

### 시나리오 2: 자동 삭제 실행

```bash
# --yes 또는 -y 플래그로 확인 없이 바로 삭제
node scripts/cleanup-stale-docs.ts --yes

# 출력:
# 🔍 Scanning .claude/docs for markdown files...
# 📁 Found 125 markdown files
# ✅ Built index of 125 unique documents
#
# 📥 Fetching documents from Qdrant...
# 📊 Qdrant has 150 documents
#
# 🗑️  Found 25 stale documents:
#   - facts/apps/old-app/index.md (Old App Documentation)
#
# 🗑️  Deleting stale documents...
#
#   ✅ Deleted: facts/apps/old-app/index.md
#   ✅ Deleted: insights/apps/deprecated-feature/impact/roi.md
#
# === Summary ===
# ✅ Deleted: 25
# ❌ Failed: 0
# 📊 Total stale: 25
#
# 📊 Updated Qdrant stats:
#   Vectors: 1250
```

### 시나리오 3: 프로덕션 환경 정리

```bash
# 배포된 서비스에 연결
export RAG_GATEWAY_URL=https://rag-gateway.onrender.com

# 미리보기 후 확인 없이 종료
node scripts/cleanup-stale-docs.ts

# 확인 후 실행
node scripts/cleanup-stale-docs.ts --yes
```

### 시나리오 4: 앱 삭제 후 정리

```bash
# 1. 앱 삭제 (예: old-app)
rm -rf apps/old-app

# 2. 관련 문서 확인
ls .claude/docs/facts/apps/
# old-app/  <- 여전히 존재

# 3. 문서 삭제 (선택사항)
rm -rf .claude/docs/facts/apps/old-app/

# 4. Qdrant 정리 실행
node scripts/cleanup-stale-docs.ts --yes
```

---

## API 사양

### 사용법

```bash
RAG_GATEWAY_URL=<url> node scripts/cleanup-stale-docs.ts [options]
```

**옵션**:

| 옵션 | 설명 |
|------|------|
| `--yes`, `-y` | 확인 없이 바로 삭제 실행 |

**환경 변수**:

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `RAG_GATEWAY_URL` | 예 | `http://localhost:3002` | RAG Gateway URL |

### 종료 코드

| 코드 | 의미 |
|------|------|
| 0 | 성공 |
| 1 | 에러 발생 |

---

## 동작 흐름

```
1. 파일시스템 스캔
   ├─ .claude/docs/ 재귀적 탐색
   ├─ 모든 .md 파일 수집
   └─ slug 생성 (파일 경로 → slug)

2. Qdrant 조회
   ├─ GET /api/documents?limit=1000
   ├─ 모든 문서 메타데이터 가져오기
   └─ slug 추출

3. Stale 문서 감지
   ├─ 파일시스템 slug 집합 생성
   ├─ Qdrant 문서와 비교
   ├─ 존재하지 않는 slug 필터링
   └─ 삭제 대상 목록 생성

4. 사용자 확인
   ├─ --yes 없으면 목록만 표시
   └─ --yes 있으면 바로 삭제 진행

5. 일괄 삭제
   ├─ DELETE /api/documents/{id}
   ├─ 각 문서별 삭제 요청
   ├─ 100ms 딜레이 (서버 부하 방지)
   └─ 성공/실패 집계

6. 결과 출력
   ├─ 삭제된 문서 수
   ├─ 실패한 문서 수
   └─ Qdrant stats 업데이트
```

---

## 제한사항

### 제한사항 1: 영구 스토리지 필요

**문제**: Render Free 환경에서는 파일시스템 접근 불가

**해결 방안**:
- 로컬 개발 환경에서만 실행
- 또는 Vercel Blob Storage 메타데이터 기반 cleanup 스크립트 개발

### 제한사항 2: 비동기 삭제

**문제**: 스크립트 실행 중 문서가 변경될 수 있음

**해결 방안**:
- 인제스트 작업 중에는 cleanup 실행하지 않기
- 또는 cleanup 전 인제스트 중지

### 제한사항 3: 대량 삭제

**문제**: 수천 개의 문서 삭제 시 시간 소요

**해결 방안**:
- `DELETE /api/admin/collection`로 전체 삭제 후 재인제스트
- 배치 처리 (현재는 100ms 딜레이)

---

## 오류 처리

### 일반적인 에러 시나리오

| 에러 | 원인 | 해결 방법 |
|------|------|----------|
| `ECONNREFUSED` | RAG Gateway 실행 중 아님 | `pnpm start`로 서버 시작 |
| `Failed to fetch documents` | API 응답 없음 | 네트워크 확인, URL 확인 |
| `Failed to delete {id}` | 삭제 권한 없음 | `X-RAG-API-Key` 확인 |

### 에러 출력

```
❌ Failed to delete abc123: Unauthorized
❌ Error deleting def456: Connection timeout

=== Summary ===
✅ Deleted: 23
❌ Failed: 2
📊 Total stale: 25
```

---

## 성능 특성

### 실행 시간

| 문서 수 | 스캔 시간 | 삭제 시간 | 총 시간 |
|---------|----------|----------|--------|
| 100 | ~1초 | ~10초 | ~11초 |
| 500 | ~2초 | ~50초 | ~52초 |
| 1000 | ~4초 | ~100초 | ~104초 |

**참고**: 삭제 시간은 100ms 딜레이 포함

### 메모리 사용

- **파일시스템 스캔**: ~5-10MB (1000파일 기준)
- **Qdrant 조회**: ~1-2MB (1000문서 기준)
- **총 사용량**: ~15MB 미만

---

## 테스트 계획

### 기능 테스트

| 테스트 케이스 | 절차 | 예상 결과 |
|--------------|------|----------|
| 정상 실행 | 1. 더미 파일 삭제 2. cleanup 실행 | stale 문서 감지 및 삭제 |
| --yes 없음 | 1. 더미 파일 삭제 2. cleanup (플래그 없음) | 목록만 표시, 삭제 안됨 |
| --yes 있음 | 1. 더미 파일 삭제 2. cleanup --yes | 바로 삭제 실행 |
| 서버 연결 실패 | 잘못된 URL로 cleanup 실행 | 에러 메시지 표시 |

### 통합 테스트

```bash
# 1. 테스트 문서 생성
mkdir -p .claude/docs/facts/apps/test-app
echo "# Test" > .claude/docs/facts/apps/test-app/index.md

# 2. 인제스트
node scripts/ingest-claude-docs.ts

# 3. 확인
curl http://localhost:3002/api/documents | jq '.documents[] | select(.slug == "facts/apps/test-app/index")'
# {"id": "...", "slug": "facts/apps/test-app/index", ...}

# 4. 파일 삭제
rm .claude/docs/facts/apps/test-app/index.md

# 5. cleanup 실행
node scripts/cleanup-stale-docs.ts --yes
# ✅ Deleted: facts/apps/test-app/index

# 6. 확인
curl http://localhost:3002/api/documents | jq '.documents[] | select(.slug == "facts/apps/test-app/index")'
# (출력 없음 - 삭제됨)
```

---

## 향후 개선 방안

### 개선 1: Blob Storage 기반 Cleanup

**문제**: Render 환경에서 파일시스템 접근 불가

**해결 방안**:
```typescript
// scripts/cleanup-stale-docs-render.ts
const blobFiles = await list({ mode: 'expanded' });
const blobSlugs = new Set(
  blobFiles
    .filter(f => f.pathname.startsWith('.claude/docs/'))
    .map(f => f.pathname.replace('.md', ''))
);

const qdrantDocs = await getQdrantDocuments();
const staleDocs = qdrantDocs.filter(doc => !blobSlugs.has(doc.slug));

for (const doc of staleDocs) {
  await deleteDocument(doc.id);
}
```

### 개선 2: 병렬 삭제

**현재**: 순차적 삭제 (100ms 딜레이)

**개선**:
```typescript
// 병렬 삭제 (10개씩)
for (let i = 0; i < staleDocs.length; i += 10) {
  const batch = staleDocs.slice(i, i + 10);
  await Promise.all(batch.map(doc => deleteDocument(doc.id)));
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 개선 3: Dry-run 모드

**기능**: 삭제할 문서 미리보기

```bash
node scripts/cleanup-stale-docs.ts --dry-run
# 📋 Would delete 25 documents:
#   - facts/apps/old-app/index.md
#   - insights/apps/deprecated-feature/impact/roi.md
#
# 💡 Run with --yes to confirm deletion
```

---

## 참고 자료

- [Facts: Utilities](../../facts/apps/rag-gateway/utils/index.md#cleanup-stale-docsts)
- [Facts: API Endpoints](../../facts/apps/rag-gateway/apis/index.md#delete-apidocumentsid)
- [DEPLOYMENT.md](../../../apps/rag-gateway/docs/DEPLOYMENT.md) - Render 배포 시 제한사항
- [render-deployment.md](./render-deployment.md) - Render 배포 전략
