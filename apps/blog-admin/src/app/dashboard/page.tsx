import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-server";
import LoginForm from "./login-form";

export default async function DashboardPage() {
  // 이미 인증된 경우 업로드 페이지로 리다이렉트
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/dashboard/upload");
  }

  // 미인증 시 로그인 폼 표시
  return <LoginForm />;
}
