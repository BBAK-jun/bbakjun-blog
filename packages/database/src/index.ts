// Re-export Prisma Client instance
export { prisma } from "./client";

// Re-export generated Prisma types
export * from "../generated/prisma";

// Re-export PrismaClient class for test setup and manual instantiation
export { PrismaClient } from "../generated/prisma";

// Re-export PrismaPg adapter for custom client creation
export { PrismaPg } from "@prisma/adapter-pg";

// Helper function for transaction handling
export { prisma as db } from "./client";
