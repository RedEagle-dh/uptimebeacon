import { defineConfig } from "prisma/config";

export default defineConfig({
	earlyAccess: true,
	schema: "./prisma/schema.prisma",
	migrate: {
		adapter: async () => {
			const { PrismaPg } = await import("@prisma/adapter-pg");
			return new PrismaPg({
				connectionString: process.env.DATABASE_URL,
			});
		},
	},
});
