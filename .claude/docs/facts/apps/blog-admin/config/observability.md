# 관찰 가능성 설정 (Observability Configuration)

- **Scope**: blog-admin 애플리케이션의 모니터링, 로깅, 디버깅 설정
- **Source of Truth**: Various (vitest.config.ts, test setup, error patterns)
- **Last Verified**: 2025-12-22
- **Repo Ref**: main

## 개요

blog-admin 애플리케이션은 현재 기본적인 로깅과 테스트 기반의 검증을 사용합니다. 별도의 APM 도구나 복잡한 모니터링 시스템은 구현되지 않았지만, Vercel 플랫폼의 기본 제공 기능과 테스트 인프라를 통해 안정성을 확보합니다.

## 현재 구현된 관찰 가능성 기능

### 1. 콘솔 로깅

#### 인증 이벤트 로깅

- **Location**: `auth.ts` (L24-37)
- **Purpose**: 사용자 생성 시 역할 할당 로깅
- **Key Details**:
  - 첫 사용자는 SUPER_ADMIN 자동 지정
  - 모든 신규 사용자 생성 이벤트 로깅
- **Dependencies**: NextAuth.js events
- **Evidence**: `auth.ts`: `console.log(\`✅ First user promoted to SUPER_ADMIN: \${user.email}\`)`

#### CDC 동기화 로깅

- **Location**: Not explicitly shown (likely in blob-cdc.ts)
- **Purpose**: Vercel Blob CDC 동기화 상태 로깅
- **Key Details**:
  - 파일 업로드/삭제 이벤트 기록
  - 동기화 성공/실패 상태 추적

### 2. 테스트 기반 검증

#### Vitest 테스트 프레임워크

- **Location**: `vitest.config.ts` (L1-17)
- **Purpose**: 통합 테스트를 통한 기능 검증
- **Key Details**:
  - Node 환경에서 테스트 실행
  - 전역 함수 활성화 (globals: true)
  - 테스트 설정 파일 지정 (setupFiles)
- **Dependencies**: Vitest, Prisma
- **Evidence**: `vitest.config.ts`: `test: { globals: true, environment: 'node', setupFiles: ['./tests/setup.ts'] }`

#### 테스트 환경 설정

- **Location**: `tests/setup.ts` (L1-61)
- **Purpose**: 테스트 실행 전후 데이터베이스 정리
- **Key Details**:
  - .env.local 파일에서 환경 변수 로드
  - 테스트 전용 Prisma Client 생성
  - 테스트 데이터 자동 정리 (test/ 접두사)
- **Dependencies**: Vitest, Prisma, @prisma/adapter-pg
- **Evidence**: `tests/setup.ts`: `await testPrisma.blobFile.deleteMany({ where: { pathname: { startsWith: 'test/' } } })`

### 3. 환경 변수 검증

#### t3-env 런타임 검증

- **Location**: `src/env.ts` (L4-78)
- **Purpose**: 애플리케이션 시작 시 환경 변수 유효성 검사
- **Key Details**:
  - 누락된 필수 변수 즉시 오류 발생
  - 잘못된 형식의 값 사전 차단
  - SKIP_ENV_VALIDATION으로 빌드 시 건너뛰기 가능
- **Dependencies**: @t3-oss/env-nextjs, Zod
- **Evidence**: `src/env.ts`: `createEnv({ server: {...}, client: {...}, runtimeEnv: {...} })`

### 4. TypeScript 타입 검사

#### 빌드 시 타입 검증

- **Location**: `package.json` (L18)
- **Purpose**: 컴파일 전 타입 오류 검출
- **Key Details**:
  - `tsc --noEmit`으로 타입만 검사
  - CI/CD 파이프라인에 통합 가능
- **Dependencies**: TypeScript compiler
- **Evidence**: `package.json`: `"type-check": "tsc --noEmit"`

## Vercel 플랫폼 관찰 가능성

### 1. Vercel Analytics

- **Status**: 설정 가능 (선택 사항)
- **Purpose**: 자동 성능 모니터링
- **주요 지표**:
  - 페이지 로드 시간
  - Web Vitals (LCP, FID, CLS)
  - 사용자 지역 및 기기 정보
  - 실시간 사용자 수

### 2. Vercel Logs

- **Status**: 기본 제공
- **Purpose**: 실시간 로그 스트리밍
- **기능**:
  - 실시간 로그 보기
  - 로그 레벨 필터링 (error, warn, info)
  - 소스 맵 연동
  - 로그 검색 및 필터링

### 3. Vercel Speed Insights

- **Status**: 자동 활성화 가능
- **Purpose**: Core Web Vitals 모니터링
- **지표**:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Cumulative Layout Shift (CLS)
  - First Input Delay (FID)

### 4. Error Tracking

- **Status**: Vercel 로그 기반
- **Purpose**: 런타임 오류 자동 수집
- **기능**:
  - 스택 트레이스 수집
  - 오류 발생 빈도 추적
  - 영향받은 사용자 수 파악

## 권장 개선 사항

### 1. 구조화된 로깅 구현

#### winston 또는 pino 사용

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
```

#### 사용 패턴

```typescript
// 로깅 레벨별 사용
logger.info('User logged in', { userId, email });
logger.error('Database connection failed', { error: error.message });
logger.warn('Rate limit approaching', { currentCount, limit });
```

### 2. APM 도구 연동

#### Sentry (Error Tracking)

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### LogRocket (Session Replay)

```typescript
// _app.tsx
import LogRocket from 'logrocket';

if (process.env.NODE_ENV === 'production') {
  LogRocket.init('your-app/id');
}
```

### 3. 성능 모니터링 강화

#### Web Vitals 측정

```typescript
// lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // analytics 서비스로 전송
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### API 응답 시간 모니터링

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const start = Date.now();

  const response = NextResponse.next();

  response.headers.set('x-response-time', `${Date.now() - start}ms`);

  return response;
}
```

### 4. 비즈니스 지표 추적

#### 사용자 활동 추적

- 파일 업로드/수정/삭제 이벤트
- 로그인 빈도 및 시간대
- API 엔드포인트 사용량

#### 시스템 상태 모니터링

```typescript
// api/health/route.ts
export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabaseConnection(),
    blob: await checkBlobConnection(),
  };

  return Response.json(health);
}
```

## 디버깅 설정

### 1. 개발 환경 디버깅

#### Next.js 디버깅 설정

```typescript
// next.config.ts (개발용)
const nextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};
```

#### Prisma 쿼리 로깅

```typescript
// lib/db.ts
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
  ],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', e => {
    console.log('Query: ' + e.query);
    console.log('Params: ' + e.params);
    console.log('Duration: ' + e.duration + 'ms');
  });
}
```

### 2. 테스트 디버깅

#### Vitest UI 모드

- **Command**: `pnpm test:ui`
- **Purpose**: 시각적 테스트 결과 확인
- **Features**:
  - 테스트 필터링
  - 커버리지 리포트
  - 스냅샷 비교

#### 테스트 커버리지

```bash
# 커버리지 리포트 생성
pnpm vitest run --coverage

# HTML 리포트 확인
open coverage/index.html
```

## 알림 설정

### 1. 에러 알림

#### Slack 연동 (Vercel Integrations)

- 빌드 실패 시 알림
- 에러 발생 시 실시간 알림
- 배포 성공 알림

#### 이메일 알림

```typescript
// lib/alerts.ts
export async function sendErrorAlert(error: Error, context: any) {
  if (process.env.NODE_ENV === 'production') {
    await resend.emails.send({
      from: 'alerts@yourapp.com',
      to: 'admin@yourapp.com',
      subject: `Error in ${context.route}`,
      html: `
        <h2>Error Details</h2>
        <p><strong>Message:</strong> ${error.message}</p>
        <p><strong>Stack:</strong></p>
        <pre>${error.stack}</pre>
        <p><strong>Context:</strong> ${JSON.stringify(context, null, 2)}</p>
      `,
    });
  }
}
```

## 로그 보관 및 분석

### 1. 로그 레벨 정책

#### 추천 레벨 설정

- **Error**: 즉시 조치 필요한 심각한 오류
- **Warn**: 잠재적 문제, 주의 필요
- **Info**: 중요한 비즈니스 이벤트
- **Debug**: 디버깅용 상세 정보

#### 로그 보관 기간

- **Production**: 30일
- **Staging**: 7일
- **Development**: 3일

### 2. 로그 분석 도구

#### ELK Stack (Elasticsearch, Logstash, Kibana)

- 대규모 로그 수집 및 분석
- 실시간 로그 시각화
- 복잡한 로그 쿼리 지원

#### Grafana + Loki

- 메트릭과 로그 통합 대시보드
- 비용 효율적인 로그 저장
- Prometheus 연동

## 현재 제한 사항

### 1. 중앙화된 로깅 부재

- 각 컴포넌트에서 console.log 사용
- 구조화된 로그 형식 없음
- 로그 레벨 관리 미구현

### 2. 실시간 모니터링 제한

- Vercel 기본 제공 기능에만 의존
- 커스텀 메트릭 수집 없음
- 비즈니스 지표 추적 부족

### 3. 알림 시스템 미구현

- 자동 에러 알림 없음
- 임계값 기반 알림 없음
- SLA 모니터링 부족
