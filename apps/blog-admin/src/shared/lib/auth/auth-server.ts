import { cookies } from "next/headers";
import { env } from "@/shared/config";

const API_KEY = env.BACKOFFICE_API_KEY;

/**
 * 서버 사이드에서 세션 쿠키를 확인하여 인증 여부 검증
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionKey = cookieStore.get("backoffice_session")?.value;

  if (!sessionKey || !API_KEY) {
    return null;
  }

  // 세션 키가 실제 API 키와 일치하는지 확인
  if (sessionKey === API_KEY) {
    return { apiKey: sessionKey };
  }

  return null;
}

/**
 * 세션이 유효한지 확인
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * API 키 검증
 */
export function verifyApiKey(key: string): boolean {
  return key === API_KEY;
}
