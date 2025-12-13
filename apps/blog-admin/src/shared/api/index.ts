/**
 * Shared API Layer
 *
 * Public API for API clients and query configuration
 */

export { apiClient } from "./admin-client";
export { createQueryClient } from "./query-client";

// Re-export types from entities for convenience
export type { FileData, BlobFile } from "@/entities/file";
export type { Session } from "@/entities/session";
