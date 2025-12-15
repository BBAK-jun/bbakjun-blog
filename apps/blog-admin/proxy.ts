import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/shared/lib/auth/session";

/**
 * Proxy: JWT 세션 검증
 * 로그인 페이지(/dashboard)를 제외한 모든 dashboard 경로 보호
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지는 인증 불필요
  if (pathname === "/dashboard") {
    return NextResponse.next();
  }

  // 세션 쿠키 확인
  const token = request.cookies.get("blog_admin_session")?.value;

  if (!token) {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // JWT 검증
  const session = await verifyToken(token);

  if (!session) {
    // 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    // 유효하지 않은 쿠키 삭제
    response.cookies.delete("blog_admin_session");
    return response;
  }

  // 인증 성공 - 요청 헤더에 사용자 정보 추가
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.userId);
  requestHeaders.set("x-username", session.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * 미들웨어 실행 경로 설정
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
