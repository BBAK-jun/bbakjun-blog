import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import LoginForm from './login-form';

export default async function LoginPage() {
  // 이미 인증된 경우 대시보드로 리다이렉트
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  // 미인증 시 로그인 폼 표시
  return <LoginForm />;
}
