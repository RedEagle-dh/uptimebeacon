import { db } from "@uptimebeacon/database";
import { NextResponse } from "next/server";

const startTime = Date.now();

export async function GET() {
	const health: {
		status: "ok" | "degraded" | "error";
		version: string;
		timestamp: string;
		uptime: number;
		environment: string;
		database: "connected" | "disconnected";
	} = {
		status: "ok",
		version: process.env.APP_VERSION ?? "unknown",
		timestamp: new Date().toISOString(),
		uptime: Math.floor((Date.now() - startTime) / 1000),
		environment: process.env.NODE_ENV ?? "unknown",
		database: "disconnected",
	};

	// Check database connectivity
	try {
		await db.$queryRaw`SELECT 1`;
		health.database = "connected";
	} catch {
		health.database = "disconnected";
		health.status = "degraded";
	}

	const statusCode = health.status === "ok" ? 200 : 503;
	return NextResponse.json(health, { status: statusCode });
}
