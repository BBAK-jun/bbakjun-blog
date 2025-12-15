import type { User } from "@/shared/types/user";
import { hashPassword } from "./password";

/**
 * 사용자 저장소 (실제로는 DB를 사용하지만, 현재는 메모리에 저장)
 * 프로덕션에서는 PostgreSQL, MongoDB 등을 사용하세요
 */
class UserRepository {
  private users: Map<string, User> = new Map();

  /**
   * 사용자 생성
   */
  async create(
    username: string,
    email: string,
    password: string
  ): Promise<User> {
    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    const user: User = {
      id,
      username,
      email,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(username, user);
    return user;
  }

  /**
   * 사용자명으로 사용자 조회
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.users.get(username) || null;
  }

  /**
   * 이메일로 사용자 조회
   */
  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  /**
   * 사용자 ID로 조회
   */
  async findById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  /**
   * 모든 사용자 조회
   */
  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

// 싱글톤 인스턴스
export const userRepository = new UserRepository();

// 개발 환경에서 기본 관리자 계정 생성
if (process.env.NODE_ENV === "development") {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";

  userRepository
    .create(adminUsername, adminEmail, adminPassword)
    .then(() => {
      console.log(`✅ Default admin account created: ${adminUsername}`);
    })
    .catch((error) => {
      console.error("Failed to create admin account:", error);
    });
}
