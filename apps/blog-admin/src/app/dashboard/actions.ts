"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyApiKey } from "@/shared/lib/auth";

type LoginState = {
  success: boolean;
  error: string;
} | null;

/**
 * 로그인 서버 액션
 */
export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const apiKey = formData.get("apiKey") as string;

  if (!apiKey || !apiKey.trim()) {
    return {
      success: false,
      error: "API 키를 입력해주세요.",
    };
  }

  // API 키 검증
  if (!verifyApiKey(apiKey.trim())) {
    return {
      success: false,
      error: "유효하지 않은 API 키입니다.",
    };
  }

  // 세션 쿠키 설정 (httpOnly, secure)
  const cookieStore = await cookies();
  cookieStore.set("backoffice_session", apiKey.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });

  redirect("/dashboard/upload");
}

/**
 * 로그아웃 서버 액션
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("backoffice_session");
  redirect("/dashboard");
}
