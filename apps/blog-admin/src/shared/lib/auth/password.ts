import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * 비밀번호를 해시화합니다
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 비밀번호를 검증합니다
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
