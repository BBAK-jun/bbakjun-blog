# 블로그 백오피스 기획서 (Markdown Blob Storage Manager)

## 1. 개요

### 목표
독립적인 **blog-admin** 애플리케이션에서 개발자가 마크다운 파일을 편집하고, 백오피스 UI를 통해 Azure Blob Storage에 직접 업로드할 수 있는 관리 시스템 구축

### 아키텍처 결정
- **blog**: 공개 블로그 (포트 3000)
- **blog-admin**: 관리자 대시보드 (포트 3001) - 별도 배포
- **packages**: 두 앱에서 공유하는 라이브러리

### 핵심 기능
- 로컬 마크다운 파일 브라우징 및 선택
- 실시간 마크다운 미리보기
- Blob Storage에 일괄/개별 업로드
- 업로드 이력 관리
- 버전 관리 (이전 버전 복원 가능)

---

## 2. 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 16 (blog-admin 전용 앱)
- **UI 라이브러리**: React 19 + Radix UI (기존 컴포넌트 활용)
- **마크다운 렌더링**: @repo/content (processMarkdown 재사용)
- **상태 관리**: React hooks + localStorage
- **HTTP 클라이언트**: fetch API
- **포트**: 3001 (blog는 3000)

### 백엔드
- **런타임**: Node.js 24
- **프레임워크**: Next.js API Routes (기존 구조 활용)
- **인증**: Bearer Token (간단한 API Key 방식)
- **파일 처리**: FormData + multipart/form-data
- **Blob Storage**: Vercel Blob SDK (@vercel/blob)

### 인프라
- **배포**: Vercel (현재 배포 환경 재사용)
- **환경 변수**: .env.local
- **스토리지**: Vercel Blob Storage
- **CDN**: Vercel의 기본 CDN 포함

---

## 3. 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│              Monorepo (pnpm workspaces)                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  apps/blog          (포트 3000 - 공개 블로그)            │
│  ├─ /blog/*         (포스트 페이지)                      │
│  ├─ /api/views      (뷰 카운팅 API)                      │
│  └─ /api/og         (OG 이미지 생성)                     │
│                                                          │
│  apps/blog-admin    (포트 3001 - 관리 대시보드)          │
│  ├─ /dashboard      (마크다운 관리 UI)                   │
│  └─ /api/admin/*    (어드민 API 엔드포인트)             │
│      ├─ /upload     (파일 업로드)                        │
│      ├─ /files      (파일 목록)                          │
│      ├─ /history    (업로드 이력)                        │
│      └─ /restore    (버전 복원)                          │
│                                                          │
│  packages/                 (공유 패키지)                 │
│  ├─ @repo/analytics        (Redis 뷰 트래킹)             │
│  ├─ @repo/content          (MDX 처리)                    │
│  ├─ @repo/types            (공유 타입)                   │
│  ├─ @repo/ui               (UI 컴포넌트)                 │
│  └─ @repo/config           (공유 설정)                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
              ↓ Azure SDK (blog-admin에서만)
        ┌─────────────────────────────────┐
        │   Azure Blob Storage            │
        │   blog-markdown container       │
        ├─────────────────────────────────┤
        │  DEV/                           │
        │  ├─ my-post.mdx                 │
        │  ├─ .metadata.json              │
        │  └─ .versions/                  │
        │                                 │
        │  REACT/                         │
        │  ├─ my-post.mdx                 │
        │  └─ .metadata.json              │
        └─────────────────────────────────┘
```

---

## 4. 데이터 모델

### FileMetadata (Blob Storage 메타데이터)
```json
{
  "id": "uuid",
  "filename": "post-title.mdx",
  "path": "DEV/post-title",
  "size": 12345,
  "contentType": "text/markdown",
  "uploadedAt": "2025-12-12T10:00:00Z",
  "uploadedBy": "user@example.com",
  "hash": "sha256:abc123...",
  "version": 1,
  "tags": ["nextjs", "typescript"],
  "status": "published" | "draft" | "archived"
}
```

### UploadHistory (데이터베이스 또는 Blob Storage에 JSON으로 저장)
```json
{
  "fileId": "uuid",
  "filename": "post-title.mdx",
  "versions": [
    {
      "version": 2,
      "uploadedAt": "2025-12-12T11:00:00Z",
      "hash": "sha256:def456...",
      "size": 12500,
      "uploadedBy": "user@example.com"
    },
    {
      "version": 1,
      "uploadedAt": "2025-12-12T10:00:00Z",
      "hash": "sha256:abc123...",
      "size": 12345
    }
  ]
}
```

---

## 5. 핵심 기능 상세

### 5.1 파일 브라우징 & 선택
```
사용자 입력
  ↓
로컬 파일 시스템 접근 (File Input API)
  ↓
선택된 마크다운 파일 목록 표시
  ↓
메타데이터 추출 (파일명, 크기, 수정일)
```

**구현 방식**:
- `<input type="file" multiple accept=".md,.mdx" />`
- 또는 drag-and-drop 영역

### 5.2 마크다운 미리보기
```
선택된 파일
  ↓
FileReader API로 콘텐츠 읽기
  ↓
@repo/content의 processMarkdown() 실행
  ↓
HTML 렌더링 (미리보기 패널)
```

**기능**:
- 실시간 미리보기
- 어두운 테마 지원
- 테이블 오브 컨텐츠 표시

### 5.3 Blob Storage 업로드
```
파일 선택
  ↓
FormData 생성
  ↓
POST /api/admin/upload 호출
  ↓
서버에서 Azure SDK로 업로드
  ↓
메타데이터 저장
  ↓
이력 기록
  ↓
응답 (success/error)
```

**업로드 전략**:
- 개별 업로드 vs 일괄 업로드 지원
- 진행상황 표시 (progressbar)
- 재시도 로직 (자동 3회 재시도)
- 충돌 감지 (해시 비교)

### 5.4 버전 관리
```
파일 업로드 시
  ↓
이전 버전 자동 백업
  ↓
새 버전으로 저장
  ↓
이력 데이터 업데이트
  ↓
옛 버전 복원 가능
```

**저장 구조**:
```
blob-markdown/
├── DEV/post-title.mdx (최신)
└── .versions/
    └── DEV/post-title/
        ├── v1.mdx
        ├── v2.mdx
        └── metadata.json
```

### 5.5 인증 & 보안
```
요청 헤더에 Bearer Token 포함
  ↓
서버에서 토큰 검증
  ↓
허가된 사용자만 업로드 가능
```

**보안 고려사항**:
- API Key는 환경 변수에 저장
- HTTPS 필수
- CORS 설정 (백오피스 도메인만 허용)
- 업로드 파일 크기 제한 (10MB)
- 파일 유형 검증 (.md, .mdx만 허용)

---

## 6. API 명세

### 6.1 파일 업로드
```
POST /api/admin/upload

Request:
{
  multipart/form-data
  - file: File (마크다운 파일)
  - path: string (저장 경로, 예: "DEV/post-title")
  - tags: string[] (선택사항)
  - status: "published" | "draft"
}

Response (Success):
{
  success: true,
  fileId: "uuid",
  version: 2,
  message: "파일이 업로드되었습니다"
}

Response (Error):
{
  success: false,
  error: "파일 크기 초과",
  code: "FILE_TOO_LARGE"
}
```

### 6.2 파일 목록 조회
```
GET /api/admin/files?category=DEV&limit=50

Response:
{
  files: [
    {
      id: "uuid",
      filename: "post-title.mdx",
      path: "DEV/post-title",
      size: 12345,
      uploadedAt: "2025-12-12T10:00:00Z",
      version: 2,
      status: "published"
    }
  ],
  total: 150
}
```

### 6.3 업로드 이력 조회
```
GET /api/admin/history?fileId=uuid

Response:
{
  fileId: "uuid",
  filename: "post-title.mdx",
  versions: [
    {
      version: 2,
      uploadedAt: "2025-12-12T11:00:00Z",
      uploadedBy: "user@example.com",
      size: 12500
    },
    {
      version: 1,
      uploadedAt: "2025-12-12T10:00:00Z",
      size: 12345
    }
  ]
}
```

### 6.4 버전 복원
```
POST /api/admin/restore

Request:
{
  fileId: "uuid",
  targetVersion: 1
}

Response:
{
  success: true,
  message: "v1로 복원되었습니다",
  newVersion: 3
}
```

### 6.5 파일 삭제
```
DELETE /api/admin/file/:fileId

Response:
{
  success: true,
  message: "파일이 삭제되었습니다"
}
```

---

## 7. UI/UX 디자인

### 7.1 페이지 레이아웃
```
┌─────────────────────────────────────────────────┐
│  📝 백오피스 - 마크다운 관리                    │  [로그아웃]
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌──────────┐  ┌───────────┐ │
│  │ 파일 선택   │  │ 미리보기 │  │ 업로드    │ │
│  │             │  │          │  │ 대기열    │ │
│  │ 📂 DEV/     │  │ 마크다운 │  │           │ │
│  │   - post1   │  │ 렌더링   │  │ ⏳ 업로드 │ │
│  │   - post2   │  │          │  │ 중...     │ │
│  │ 📂 REACT/   │  │          │  │           │ │
│  │   - post3   │  │ [theme:  │  │ [×] 취소  │ │
│  │             │  │  dark]   │  │ [업로드]  │ │
│  └─────────────┘  └──────────┘  └───────────┘ │
│                                                 │
│  📋 업로드 이력                                │
│  ┌────────────────────────────────────────┐   │
│  │ DEV/post-title v2 | 11:00 | 12.5KB    │   │
│  │ DEV/post-title v1 | 10:00 | 12.3KB    │   │
│  │ REACT/example v1  | 09:00 | 8.2KB     │   │
│  └────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 7.2 주요 컴포넌트
- `FileSelector`: 파일 선택 영역
- `MarkdownPreview`: 미리보기 패널 (@repo/content 재사용)
- `UploadQueue`: 업로드 대기열
- `UploadHistory`: 이력 테이블
- `VersionRestore`: 버전 복원 모달

---

## 8. 개발 단계

### Phase 1: 기초 구조 (1-2주)
- [ ] Next.js 백오피스 페이지 생성
- [ ] 기본 파일 선택 UI
- [ ] 마크다운 미리보기 통합
- [ ] API Routes 스켈레톤

### Phase 2: Blob Storage 연동 (2-3주)
- [ ] Azure SDK 설정
- [ ] 파일 업로드 API 구현
- [ ] 메타데이터 저장 로직
- [ ] 에러 처리 & 재시도 로직

### Phase 3: 버전 관리 & 이력 (1-2주)
- [ ] 버전 관리 시스템
- [ ] 이력 조회 API
- [ ] 버전 복원 기능
- [ ] 이력 UI

### Phase 4: 보안 & 최적화 (1주)
- [ ] 인증 시스템
- [ ] 파일 크기/유형 검증
- [ ] 접근 제어
- [ ] 성능 최적화

### Phase 5: 배포 & 모니터링 (1주)
- [ ] 프로덕션 환경 설정
- [ ] 로깅 & 모니터링
- [ ] 에러 트래킹
- [ ] 문서화

---

## 9. 환경 변수

```env
# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Backoffice 보안
BACKOFFICE_API_KEY=your-secret-api-key

# 기타
MAX_FILE_SIZE=10485760  # 10MB (bytes)
ALLOWED_FILE_TYPES=md,mdx
```

### 환경 변수 획득 방법

**BLOB_READ_WRITE_TOKEN**:
1. Vercel 프로젝트 대시보드 접속
2. Settings → Storage → Create Database (Blob 선택)
3. .env.local에 자동 생성된 토큰 복사

---

## 10. 위험 요소 & 완화 방안

| 위험 요소 | 심각도 | 완화 방안 |
|----------|--------|---------|
| 마크다운 파일 손실 | High | 자동 버전 관리, 정기 백업 |
| 무단 접근 | High | API Key 인증, IP 화이트리스트 |
| 파일 크기 폭증 | Medium | 업로드 크기 제한, 자동 정리 |
| Blob Storage 비용 | Medium | 저장소 모니터링, 오래된 버전 자동 삭제 |
| 마크다운 XSS | Medium | @repo/content 사용 (이미 처리됨) |

---

## 11. 성공 지표

- [ ] 50MB 이상의 파일 안정적 업로드
- [ ] 99.9% 업로드 성공률
- [ ] 1초 이내 파일 미리보기
- [ ] 모든 버전 복원 가능
- [ ] 접근 제어 완벽 작동

---

## 12. 향후 확장 기능 (Optional)

1. **자동 배포**: 업로드 후 자동으로 블로그에 반영
2. **협업 기능**: 여러 사용자의 동시 편집
3. **이미지 관리**: 마크다운에 포함된 이미지도 함께 업로드
4. **SEO 최적화**: Meta 데이터 자동 생성
5. **AI 보조**: GPT를 통한 마크다운 자동 완성
6. **검색**: Blob Storage의 파일 전문 검색
7. **분석**: 포스트 조회수, 체류시간 등 분석

---

## 13. 참고 자료

- [Azure Blob Storage SDK for JavaScript](https://learn.microsoft.com/en-us/javascript/api/overview/azure/storage-blob-readme)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [File API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/File)
- [Markdown Rendering (현 프로젝트)](https://github.com/BBAK-jun/bbakjun-blog/tree/main/packages/content)

---

## 문서 작성일
2025-12-12

## 최종 승인
대기 중...
