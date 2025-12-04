import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	PORT: z.coerce.number().default(3001),
	DATABASE_URL: z.string().url(),
	FRONTEND_URL: z.string().url().default("http://localhost:3000"),
	// Initial admin credentials (optional - if set, admin user will be created on startup)
	INITIAL_ADMIN_EMAIL: z.string().optional(),
	INITIAL_ADMIN_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
