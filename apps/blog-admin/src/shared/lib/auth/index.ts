// 새로운 JWT 기반 인증 시스템
export * from "./session";
export * from "./password";
export { userRepository } from "./users";

// 레거시 API 키 인증 (하위 호환성)
export { verifyApiKey as verifyApiKeyAsync, verifyApiKeySync } from "./auth";
export { verifyApiKey as verifyApiKeyLegacy } from "./auth-server";
