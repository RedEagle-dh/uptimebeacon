import type { Monitor } from "@uptimebeacon/database";
import type { CheckResult } from "./types";

export async function checkPing(
	monitor: Monitor,
	startTime: number,
): Promise<CheckResult> {
	if (!monitor.hostname) {
		return {
			status: "DOWN",
			error: "Hostname is required for ping checks",
		};
	}

	try {
		// Use Bun's shell to execute ping command
		const isWindows = process.platform === "win32";
		const pingCount = isWindows ? "-n" : "-c";
		const pingTimeout = isWindows ? "-w" : "-W";
		const timeoutSec = Math.min(monitor.timeout, 10);

		const proc = Bun.spawn(
			[
				"ping",
				pingCount,
				"1",
				pingTimeout,
				String(timeoutSec),
				monitor.hostname,
			],
			{
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const exitCode = await proc.exited;
		const responseTime = Date.now() - startTime;

		if (exitCode === 0) {
			// Parse response time from ping output
			const stdout = await new Response(proc.stdout).text();
			const timeMatch = stdout.match(/time[=<](\d+(?:\.\d+)?)\s*ms/i);
			const pingTime =
				timeMatch?.[1] !== undefined
					? Number.parseFloat(timeMatch[1])
					: undefined;

			return {
				status: "UP",
				responseTime: pingTime ?? responseTime,
				message: `Ping to ${monitor.hostname} successful`,
			};
		}

		return {
			status: "DOWN",
			responseTime,
			error: `Ping to ${monitor.hostname} failed`,
		};
	} catch (error) {
		return {
			status: "DOWN",
			responseTime: Date.now() - startTime,
			error: error instanceof Error ? error.message : "Ping failed",
		};
	}
}
