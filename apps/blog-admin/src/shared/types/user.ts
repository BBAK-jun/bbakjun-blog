/**
 * 사용자 계정 타입 정의
 */
export type User = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * 로그인 요청 데이터
 */
export type LoginCredentials = {
  username: string;
  password: string;
};

/**
 * 세션 페이로드 (JWT에 저장될 데이터)
 */
export type SessionPayload = {
  userId: string;
  username: string;
  email: string;
};

/**
 * 인증된 세션 정보
 */
export type Session = SessionPayload & {
  expiresAt: Date;
};
