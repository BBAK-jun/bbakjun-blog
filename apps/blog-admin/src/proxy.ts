import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "../auth";

/**
 * Next.js 16 Proxy: Auth.js 세션 검증
 * 로그인 페이지(/login)를 제외한 모든 dashboard 경로 보호
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 로그인 페이지와 권한 없음 페이지는 인증 불필요
  if (pathname === "/login" || pathname === "/unauthorized") {
    return NextResponse.next();
  }

  // Auth.js 세션 확인
  const session = await auth();

  if (!session?.user) {
    // 세션이 없으면 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // SUPER_ADMIN만 접근 허용
  if (session.user.role !== "SUPER_ADMIN") {
    // 권한이 없으면 접근 거부 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // 인증 성공 - 요청 헤더에 사용자 정보 추가
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", session.user.id);
  requestHeaders.set("x-user-email", session.user.email);
  requestHeaders.set("x-user-role", session.user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Proxy 실행 경로 설정
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
