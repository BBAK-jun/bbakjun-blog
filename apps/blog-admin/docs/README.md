# Blog-Admin 문서

모든 문서가 여기에 있습니다. 아래 가이드를 선택하세요.

## 📚 문서 목차

### 1. [시작하기](./SETUP.md)

**처음 사용하시나요?** 이 가이드를 먼저 읽으세요.

내용:

- 사전 요구사항
- Node.js/pnpm 설치
- Vercel Blob Storage 설정
- 환경 변수 구성
- 개발 서버 실행
- 문제 해결

**소요 시간**: 10-15분

---

### 2. [API 문서](./API.md)

**API가 뭐하는지 알고 싶어요?** 이곳이 답입니다.

내용:

- API 개요 및 인증
- 파일 업로드 엔드포인트
- 파일 목록 조회 엔드포인트
- 요청/응답 형식
- 에러 코드
- 사용 예시 (JavaScript, cURL)

**주요 엔드포인트**:

- `POST /api/admin/upload` - 파일 업로드
- `GET /api/admin/files` - 파일 목록

---

### 3. [아키텍처](./ARCHITECTURE.md)

**시스템이 어떻게 구성되는지 알고 싶어요?** 이곳에서 설명합니다.

내용:

- 전체 시스템 구조
- 디렉토리 구조 상세
- 핵심 모듈 설명
- 데이터 흐름
- 보안 고려사항
- 성능 최적화
- 기술 스택

---

### 4. [배포 가이드](./DEPLOYMENT.md)

**프로덕션 배포 방법을 알고 싶어요?** 여기를 보세요.

내용:

- 배포 전 체크리스트
- Vercel에 배포 (자동/수동)
- 환경 변수 설정
- 배포 후 확인
- 모니터링
- 문제 해결
- 롤백

**예상 배포 시간**: 2-3분

---

### 5. [개발 가이드](./DEVELOPMENT.md)

**기능을 개발하고 싶어요?** 이 가이드를 따라하세요.

내용:

- 개발 환경 설정
- 개발 워크플로우 (Step by Step)
- 새 기능 추가 방법
- 테스트 방법
- 디버깅 팁
- 코드 스타일 가이드
- Git 커밋 메시지 가이드

---

## 🎯 빠른 시작

### 3분 안에 시작하기

```bash
# 1. Node 버전 확인
node --version  # v24.x.x 필요

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
# Vercel에서 BLOB_READ_WRITE_TOKEN 복사
cat > .env.local << 'EOF'
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
BACKOFFICE_API_KEY=your-secret-key
EOF

# 4. 개발 서버 실행
pnpm dev:admin

# 5. 브라우저 열기
# http://localhost:3001/dashboard
```

---

## 📋 작업별 가이드

### "로컬에서 개발하고 싶어요"

1. [시작하기](./SETUP.md) 따라하기
2. [개발 가이드](./DEVELOPMENT.md) 읽기
3. `pnpm dev:admin` 실행

### "새 API를 만들고 싶어요"

1. [개발 가이드](./DEVELOPMENT.md)의 "새 기능 추가" 섹션
2. [API 문서](./API.md)에 문서화
3. API 테스트

### "프로덕션에 배포하고 싶어요"

1. [배포 가이드](./DEPLOYMENT.md) 읽기
2. 배포 전 체크리스트 확인
3. Vercel에 배포

### "시스템을 이해하고 싶어요"

[아키텍처](./ARCHITECTURE.md) 문서 읽기

### "API를 사용하고 싶어요"

[API 문서](./API.md)의 "사용 예시" 섹션

---

## 🆘 도움이 필요해요

### 문제별 해결 가이드

| 문제           | 가이드                                                    |
| -------------- | --------------------------------------------------------- |
| Node 버전 오류 | [설정 가이드](./SETUP.md#node-버전-오류)                  |
| 환경 변수 오류 | [설정 가이드](./SETUP.md#blob_read_write_token-관련-오류) |
| 포트 충돌      | [설정 가이드](./SETUP.md#포트-충돌)                       |
| 빌드 실패      | [설정 가이드](./SETUP.md#빌드-실패)                       |
| 배포 실패      | [배포 가이드](./DEPLOYMENT.md#배포-실패)                  |
| API 오류       | [API 문서](./API.md#에러-코드)                            |

---

## 📖 추천 읽기 순서

### 처음 사용자

1. **시작하기** (15분) - 개발 환경 설정
2. **API 문서** (10분) - API가 뭐하는지 이해
3. **개발 가이드** (20분) - 개발 방법 학습

### 기존 개발자

1. **아키텍처** (20분) - 시스템 이해
2. **개발 가이드** (15분) - 개발 워크플로우
3. **API 문서** (필요시) - API 참고

### 배포 담당자

1. **배포 가이드** (20분) - 배포 절차
2. **아키텍처** (선택) - 시스템 이해
3. **설정 가이드** (선택) - 환경 변수

---

## 🔗 추가 리소스

### 공식 문서

- [Vercel 문서](https://vercel.com/docs)
- [Next.js 문서](https://nextjs.org/docs)
- [TypeScript 문서](https://www.typescriptlang.org/docs)
- [Vercel Blob API](https://vercel.com/docs/storage/vercel-blob/api-reference)

### 커뮤니티

- [Next.js Discord](https://discord.gg/bUG2bvbtHy)
- [Vercel Support](https://vercel.com/support)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

## 💡 팁

### 개발 중 자주 사용하는 명령어

```bash
# 개발 서버 실행
pnpm dev:admin

# blog와 함께 실행
pnpm dev:all

# 타입 확인
pnpm type-check

# 린트 확인
pnpm lint

# 빌드
pnpm build:admin

# API 테스트
curl -H "Authorization: Bearer key" http://localhost:3001/api/admin/files
```

### 문서 찾기

- Ctrl+F 또는 Cmd+F로 검색
- 목차를 이용한 빠른 이동
- 링크를 통한 문서 간 네비게이션

---

## 📝 문서 버전

| 문서            | 버전  | 업데이트   |
| --------------- | ----- | ---------- |
| SETUP.md        | 1.0.0 | 2025-12-12 |
| API.md          | 1.0.0 | 2025-12-12 |
| ARCHITECTURE.md | 1.0.0 | 2025-12-12 |
| DEPLOYMENT.md   | 1.0.0 | 2025-12-12 |
| DEVELOPMENT.md  | 1.0.0 | 2025-12-12 |

---

## 🤝 기여하기

문서를 개선하고 싶으신가요?

1. GitHub에서 Fork
2. 수정 사항 커밋
3. Pull Request 생성

---

**Last Updated**: 2025-12-12
**Status**: ✅ Complete
