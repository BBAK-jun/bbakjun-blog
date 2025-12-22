# Error Handling Patterns

- **Scope**: blog-admin API의 에러 처리 및 응답 표준
- **Source of Truth**: RPC 미들웨어, 핸들러, Zod 스키마
- **Last Verified**: 2025-12-22
- **Repo Ref**: 2c541823391c87ad23934193eddd21e2335f0b09

## 글로벌 에러 핸들러

### RPC 에러 핸들러

- **Location**: `apps/blog-admin/src/rpc/index.ts` (L89-94)
- **Purpose**: RPC 앱 전체의 에러 일관성 보장
- **Key Details**:
  - 404: "Not Found" 표준 응답
  - 500: "Internal Server Error" 로깅 포함
  - 모든 에러를 JSON 형식으로 반환
- **Dependencies**:
  - Hono 에러 핸들러: app.onError, app.notFound
  - 콘솔 로깅: 에러 추적
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: app.onError에서 console.error 후 JSON 응답

### 에러 응답 형식

```typescript
// 표준 에러 응답
{
  "error": "에러 메시지"
}
```

- **Location**: `apps/blog-admin/src/shared/api/contracts.ts` (L10-16)
- **Purpose**: 모든 API 에러의 일관된 형식 정의
- **Key Details**:
  - Zod 스키마로 타입 보장
  - ErrorResponse 타입 내보내기
- **Dependencies**:
  - zod: 스키마 정의
- **Evidence**:
  - `<apps/blog-admin/src/shared/api/contracts.ts>`: errorResponseSchema와 ErrorResponse 타입

## HTTP 상태 코드별 에러 처리

### 400 Bad Request

- **발생 조건**: 잘못된 요청 파라미터, 필수 필드 누락
- **예시**: Query 파라미터 타입 오류, 필수 데이터 부재
- **Response**: `{"error": "Invalid request parameters"}`
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/blob-files/getBlobFiles.ts>`: 400 상태 코드와 에러 스키마 정의

### 401 Unauthorized

- **발생 조건**: 세션 없음, 잘못된 API 키
- **미들웨어**: requireSession, requireAdminSession
- **Response**: `{"error": "Unauthorized"}`
- **Evidence**:
  - `<apps/blog-admin/src/rpc/middleware/session.ts>`: 401 반환 시 error: 'Unauthorized'

### 403 Forbidden

- **발생 조건**: 권한 부족 (ADMIN 필요한 곳에 GUEST 접근)
- **미들웨어**: requireAdminSession
- **Response**: `{"error": "Unauthorized"}` (401과 동일한 메시지)
- **Evidence**:
  - `<apps/blog-admin/src/rpc/middleware/session.ts>`: role이 ADMIN/SUPER_ADMIN 아닌 경우

### 404 Not Found

- **발생 조건**: 존재하지 않는 API 경로, 리소스 없음
- **글로벌 핸들러**: app.notFound
- **Response**: `{"error": "Not Found"}`
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: app.notFound 핸들러 정의

### 422 Unprocessable Entity

- **발생 조건**: Zod 검증 실패, 비즈니스 규칙 위배
- **사용 위치**: 파일 업로드, 이메일 검증
- **Response**: `{"error": "Validation failed"}`
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/upload/uploadMarkdown.ts>`: 파일 검증 실패 시

### 500 Internal Server Error

- **발생 조건**: 예상치 못한 서버 오류, DB 연결 실패
- **글로벌 핸들러**: app.onError
- **Response**: `{"error": "Internal Server Error"}`
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: app.onError에서 500 반환 및 로깅

## 특정 기능별 에러 처리

### Blob Files API 에러

- **Location**: `apps/blog-admin/src/rpc/routes/blob-files/getBlobFiles.ts` (L54-61)
- **Purpose**: 파일 목록 조회 실패 처리
- **Key Details**:
  - try-catch로 예외 포착
  - 콘솔에 상세 에러 로깅
  - 500 상태 코드와 사용자 친화적 메시지
- **Dependencies**:
  - getCachedBlobFiles: 캐시 조회 함수
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/blob-files/getBlobFiles.ts>`: catch 블록에서 error 로깅

### Upload API 에러

#### 파일 유효성 검증

- **Location**: `apps/blog-admin/src/rpc/routes/upload/uploadMarkdown.ts`
- **Purpose**: 업로드 파일 검증 실패 처리
- **Key Details**:
  - 파일 크기 제한 (10MB)
  - 파일 확장자 검증
  - 파일명 특수문자 필터링
- **Dependencies**:
  - Hono c.req.parseBody(): multipart 파싱
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/upload/uploadImage.ts>`: 이미지 포맷 검증 로직

#### 이미지 처리 에러

- **Location**: `apps/blog-admin/src/rpc/routes/upload/uploadImage.ts`
- **Purpose**: 이미지 처리 실패 처리
- **Key Details**:
  - Sharp 처리 오류 포착
  - 잘못된 이미지 포맷
  - Vercel Blob 업로드 실패
- **Dependencies**:
  - Sharp: 이미지 처리 라이브러리
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/upload/uploadImage.ts>`: 이미지 리사이즈 에러 핸들링

### Newsletter API 에러

#### 이메일 검증 실패

- **Location**: `apps/blog-admin/src/rpc/routes/newsletter/subscribeNewsletter.ts`
- **Purpose**: 잘못된 이메일 주소 처리
- **Key Details**:
  - Zod 이메일 스키마 검증
  - 중복 구독 방지
  - Resend API 실패 처리
- **Dependencies**:
  - zod.string().email(): 이메일 형식 검증
  - Resend: 이메일 발송
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/newsletter/subscribeNewsletter.ts>`: 이메일 중복 체크

#### Resend API 에러

- **발생 조건**: 이메일 발송 실패, API 키 문제
- **처리 방식**: 에러 로깅 후 500 반환
- **Response**: `{"error": "Failed to send confirmation email"}`
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/newsletter/subscribeNewsletter.ts>`: Resend API try-catch

### Views API 에러

#### Redis 연결 실패

- **Location**: `apps/blog-admin/src/rpc/routes/views/getViewsBySlug.ts`
- **Purpose**: Redis 접속 실패 처리
- **Key Details**:
  - Fallback: 0 반환 (앱 계속 동작)
  - 연결 타임아웃 처리
  - 재시도 로직 (선택적)
- **Dependencies**:
  - Redis 클라이언트
- **Evidence**:
  - `<apps/blog-admin/src/analytics/src/views.ts>`: Redis 에러 핸들링

## 에러 로깅 전략

### 로깅 레벨

1. **Error**: 치명적 오류 (DB 연결, 외부 API 실패)
2. **Warn**: 복구 가능한 문제 (재시도 필요)
3. **Info**: 중요 이벤트 (사용자 생성, 파일 업로드)
4. **Debug**: 상세 디버깅 정보

### 로그 형식

```typescript
console.error('[API] Context: Error message', {
  error: error.message,
  stack: error.stack,
  userId: session?.user?.id,
  timestamp: new Date().toISOString(),
});
```

### 에러 추적

- **Location**: 전역 에러 핸들러
- **Purpose**: 에러 추적 및 모니터링
- **Key Details**:
  - 스택 트레이스 보존
  - 사용자 컨텍스트 포함
  - 타임스탬프 기록
- **Dependencies**:
  - 콘솔 로깅: 개발 환경
  - 에러 추적 서비스: 프로덕션 (Sentry 등)
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: console.error('RPC error:', err)

## 클라이언트 에러 처리

### 프론트엔드 통합

- **Location**: blog 앱의 RPC 클라이언트
- **Purpose**: API 에러에 대한 사용자 피드백
- **Key Details**:
  - HTTP 상태 코드 확인
  - 에러 메시지 표시
  - 재시도 로직 구현
- **Dependencies**:
  - Hono Client: hc<AppType>()
  - React Query: 에러 바운더리
- **Evidence**:
  - `apps/blog/src/lib/rpc.ts`: RPC 클라이언트 에러 핸들링

### 에러 타입 정의

```typescript
interface ApiError {
  error: string;
  status?: number;
  details?: any;
}
```

## 보안 고려사항

### 정보 노출 방지

- **에러 메시지**: 사용자에게 최소한의 정보만 노출
- **스택 트레이스**: 개발 환경에서만 노출
- **DB 에러**: 일반적 메시지로 마스킹
- **Evidence**:
  - `<apps/blog-admin/src/rpc/index.ts>`: 500 에러 시 "Internal Server Error"만 반환

### 에러 로그 보안

- **민감 정보**: 비밀번호, API 키 로깅 제외
- **PII**: 개인식별정보 마스킹
- **로그 저장**: 안전한 저장소 사용
- **Evidence**:
  - `<apps/blog-admin/src/rpc/routes/newsletter/subscribeNewsletter.ts>`: 이메일 마스킹 로깅
