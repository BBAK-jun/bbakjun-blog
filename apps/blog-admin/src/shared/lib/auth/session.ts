import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Session, SessionPayload } from "@/shared/types/user";
import { env } from "@/shared/config";

// JWT 시크릿 키 (환경변수에서 가져오기)
function getJwtSecret(): Uint8Array {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

const SESSION_COOKIE_NAME = "blog_admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60; // 7일 (초 단위)

/**
 * JWT 토큰 생성
 */
export async function createToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION)
    .sign(secret);
}

/**
 * JWT 토큰 검증 및 디코딩
 */
export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    // 페이로드 검증
    if (
      !payload.userId ||
      !payload.username ||
      !payload.email ||
      !payload.exp
    ) {
      return null;
    }

    return {
      userId: payload.userId as string,
      username: payload.username as string,
      email: payload.email as string,
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * 세션 생성 및 쿠키 저장
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

/**
 * 현재 세션 가져오기
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * 세션 삭제 (로그아웃)
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * 인증 상태 확인
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
