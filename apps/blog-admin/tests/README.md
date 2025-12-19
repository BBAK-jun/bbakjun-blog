# Blog Admin 테스트

## 테스트 전략

이 프로젝트는 **통합 테스트 (Integration Test)** 방식을 사용합니다.

### 왜 통합 테스트인가?

**유닛 테스트 vs E2E 테스트 vs 통합 테스트**:

| 방식 | 장점 | 단점 | 이 프로젝트에 적합? |
|------|------|------|-------------------|
| 유닛 테스트 | 빠름, 독립적 | DB 모킹 필요, 실제 동작 검증 불가 | ❌ |
| E2E 테스트 | 전체 플로우 검증 | 느림, Vercel Blob API 비용 발생 | ❌ |
| **통합 테스트** | 실제 DB 사용, Blob API 모킹, 빠름 | - | ✅ |

### 통합 테스트의 핵심

1. **실제 PostgreSQL 데이터베이스 사용**
   - CDC 로직의 핵심은 DB 상태 관리
   - Unique constraint 검증은 실제 DB에서만 가능

2. **Vercel Blob API는 모킹 불필요**
   - CDC 함수(`onBlobUpload`, `onBlobDelete`)는 Blob API를 직접 호출하지 않음
   - Blob 메타데이터만 받아서 DB에 저장

3. **빠른 실행 속도**
   - 네트워크 호출 없음 (로컬 DB만 사용)
   - 테스트 실행 시간: ~6초 (10개 테스트)

## 테스트 구조

```
apps/blog-admin/
├── tests/
│   ├── setup.ts              # 전역 설정 (DB 클라이언트, cleanup)
│   ├── blob-cdc.test.ts      # CDC 통합 테스트
│   └── README.md             # 이 문서
├── vitest.config.ts          # Vitest 설정
└── package.json              # 테스트 스크립트
```

## 실행 방법

```bash
# 전체 테스트 실행 (watch mode)
pnpm test

# 한 번만 실행
pnpm test:run

# UI 모드 (브라우저에서 실행)
pnpm test:ui
```

## 테스트 커버리지

### `blob-cdc.test.ts`

CDC 시스템의 핵심 기능을 검증:

#### 1. `onBlobUpload` 테스트
- ✅ 첫 업로드 시 새 레코드 생성
- ✅ 재업로드 시 기존 레코드 업데이트 (중복 방지)
- ✅ 삭제된 파일 재업로드 시 복구
- ✅ 동일 pathname에 대해 중복 레코드 방지
- ✅ `lastChecked` 타임스탬프 업데이트

#### 2. `onBlobDelete` 테스트
- ✅ Soft delete (레코드 유지, `isDeleted` 플래그)
- ✅ `lastChecked` 타임스탬프 업데이트
- ✅ 존재하지 않는 pathname 삭제 시 에러

#### 3. Pathname Unique Constraint 테스트
- ✅ DB 레벨에서 unique constraint 검증
- ✅ 다른 pathname은 정상적으로 생성 가능

## 테스트 데이터 관리

### 자동 Cleanup

```typescript
// tests/setup.ts
beforeAll(async () => {
  // 이전 테스트의 잔여 데이터 삭제
  await testPrisma.blobFile.deleteMany({
    where: { pathname: { startsWith: 'test/' } }
  });
});

afterAll(async () => {
  // 테스트 후 데이터 정리
  await testPrisma.blobFile.deleteMany({
    where: { pathname: { startsWith: 'test/' } }
  });
});
```

### 테스트 격리

각 테스트는 독립적으로 실행됩니다:
- `beforeEach`: 테스트 전 데이터 삭제
- `afterEach`: 테스트 후 데이터 삭제

테스트 데이터는 항상 `test/` prefix를 사용하여 실제 데이터와 분리합니다.

## 환경 설정

### 필수 환경 변수

테스트는 `.env.local` 파일에서 환경 변수를 로드합니다:

```env
DATABASE_URL=postgresql://...
```

### Prisma Client 생성

테스트 실행 전 Prisma Client가 생성되어 있어야 합니다:

```bash
pnpm --filter=blog-admin prisma generate
```

## 테스트 작성 가이드

### 새로운 CDC 기능 추가 시

1. **테스트 먼저 작성 (TDD)**:
   ```typescript
   it('should do something', async () => {
     // Given: 초기 상태 설정
     // When: 기능 실행
     // Then: 결과 검증
   });
   ```

2. **테스트 데이터는 `test/` prefix 사용**:
   ```typescript
   const testPathname = 'test/my-feature.mdx';
   ```

3. **Cleanup 잊지 않기**:
   ```typescript
   afterEach(async () => {
     await testPrisma.blobFile.deleteMany({
       where: { pathname: testPathname }
     });
   });
   ```

### 예제: 새로운 CDC 함수 테스트

```typescript
describe('onBlobBatchUpload', () => {
  it('should upload multiple files at once', async () => {
    const files = [
      { pathname: 'test/file1.mdx', url: '...', size: 1000 },
      { pathname: 'test/file2.mdx', url: '...', size: 2000 },
    ];

    await onBlobBatchUpload(files);

    const count = await testPrisma.blobFile.count({
      where: {
        pathname: { in: files.map(f => f.pathname) }
      }
    });

    expect(count).toBe(2);
  });
});
```

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: pnpm install

      - name: Generate Prisma Client
        run: pnpm --filter=blog-admin prisma generate

      - name: Run tests
        run: pnpm --filter=blog-admin test:run
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## 문제 해결

### 테스트 실패 시

1. **DB 연결 실패**:
   ```bash
   # .env.local 파일이 있는지 확인
   ls -la .env.local

   # DATABASE_URL이 올바른지 확인
   echo $DATABASE_URL
   ```

2. **Unique constraint 에러**:
   ```bash
   # 테스트 데이터가 남아있을 수 있음
   # DB에서 수동으로 삭제
   psql $DATABASE_URL -c "DELETE FROM blob_files WHERE pathname LIKE 'test/%';"
   ```

3. **Prisma Client 오류**:
   ```bash
   # Prisma Client 재생성
   pnpm --filter=blog-admin prisma generate
   ```

## 참고 자료

- [Vitest 공식 문서](https://vitest.dev/)
- [Prisma 테스트 가이드](https://www.prisma.io/docs/guides/testing)
- [통합 테스트 vs E2E](https://martinfowler.com/bliki/IntegrationTest.html)
