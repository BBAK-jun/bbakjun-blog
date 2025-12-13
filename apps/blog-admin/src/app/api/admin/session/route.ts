import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";

/**
 * 현재 세션 정보 조회
 */
export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    apiKey: session.apiKey,
  });
}
