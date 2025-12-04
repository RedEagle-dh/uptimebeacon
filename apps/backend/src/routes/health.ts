import { Elysia } from "elysia";
import { getActiveMonitorCount } from "../services/scheduler";
import { getConnectedClientsCount } from "../websocket";

export const healthRoutes = new Elysia({ prefix: "/api" })
	.get("/health", () => ({
		status: "ok",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
	}))

	.get("/stats", () => ({
		activeMonitors: getActiveMonitorCount(),
		connectedClients: getConnectedClientsCount(),
		memoryUsage: process.memoryUsage(),
		uptime: process.uptime(),
	}));
