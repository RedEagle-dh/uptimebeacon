// Re-export everything from generated Prisma client
export * from "../generated/prisma/client";

// Re-export the singleton database instance
export { db } from "./client";

// Re-export crypto utilities
export { decrypt, encrypt, isEncrypted, maskSensitiveValue } from "./crypto";
