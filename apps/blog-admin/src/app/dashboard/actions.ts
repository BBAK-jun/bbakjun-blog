'use server';

import { signOut } from '../../../auth';

/**
 * 로그아웃 서버 액션 (Auth.js)
 */
export async function logout() {
  await signOut({ redirectTo: '/login' });
}
