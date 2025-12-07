import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error("DATABASE_URL environment variable is not set");
	}

	const adapter = new PrismaPg({ connectionString });

	return new PrismaClient({
		adapter,
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});
};

const getDb = () => {
	if (!globalForPrisma.prisma) {
		globalForPrisma.prisma = createPrismaClient();
	}
	return globalForPrisma.prisma;
};

// Lazy proxy - only creates the client when a property is accessed
export const db = new Proxy({} as PrismaClient, {
	get(_, prop) {
		const client = getDb();
		const value = client[prop as keyof PrismaClient];
		return typeof value === "function" ? value.bind(client) : value;
	},
});
