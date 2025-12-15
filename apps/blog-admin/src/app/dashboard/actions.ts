"use server";

import { redirect } from "next/navigation";
import { userRepository } from "@/shared/lib/auth/users";
import { verifyPassword } from "@/shared/lib/auth/password";
import { createSession, deleteSession } from "@/shared/lib/auth/session";

type LoginState = {
  success: boolean;
  error: string;
} | null;

/**
 * 로그인 서버 액션
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // 입력 검증
  if (!username || !username.trim()) {
    return {
      success: false,
      error: "사용자 이름을 입력해주세요.",
    };
  }

  if (!password || !password.trim()) {
    return {
      success: false,
      error: "비밀번호를 입력해주세요.",
    };
  }

  // 사용자 조회
  const user = await userRepository.findByUsername(username.trim());

  if (!user) {
    return {
      success: false,
      error: "사용자를 찾을 수 없습니다.",
    };
  }

  // 비밀번호 검증
  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    return {
      success: false,
      error: "비밀번호가 일치하지 않습니다.",
    };
  }

  // JWT 세션 생성
  await createSession({
    userId: user.id,
    username: user.username,
    email: user.email,
  });

  redirect("/dashboard/upload");
}

/**
 * 로그아웃 서버 액션
 */
export async function logout() {
  await deleteSession();
  redirect("/dashboard");
}
