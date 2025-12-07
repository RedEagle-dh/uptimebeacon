import type { Monitor } from "@uptimebeacon/database";
import type { CheckResult } from "./types";

export async function checkTcp(
	monitor: Monitor,
	startTime: number,
): Promise<CheckResult> {
	if (!monitor.hostname || !monitor.port) {
		return {
			status: "DOWN",
			error: "Hostname and port are required for TCP checks",
		};
	}

	try {
		const socket = await Bun.connect({
			hostname: monitor.hostname,
			port: monitor.port,
			socket: {
				data() {},
				open() {},
				close() {},
				error() {},
			},
		});

		const responseTime = Date.now() - startTime;

		// Check if connection was successful
		if (socket) {
			socket.end();
			return {
				status: "UP",
				responseTime,
				message: `TCP connection to ${monitor.hostname}:${monitor.port} successful`,
			};
		}

		return {
			status: "DOWN",
			responseTime,
			error: "Failed to establish TCP connection",
		};
	} catch (error) {
		return {
			status: "DOWN",
			responseTime: Date.now() - startTime,
			error: error instanceof Error ? error.message : "TCP connection failed",
		};
	}
}
