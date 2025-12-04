import type { Monitor } from "@uptimebeacon/database";
import { checkDns } from "./dns";
import { checkHttp } from "./http";
import { checkPing } from "./ping";
import { checkTcp } from "./tcp";
import type { CheckResult } from "./types";

export type { CheckResult };

export async function runCheck(monitor: Monitor): Promise<CheckResult> {
	const startTime = Date.now();

	try {
		switch (monitor.type) {
			case "HTTP":
			case "HTTPS":
			case "KEYWORD":
			case "JSON_QUERY":
				return await checkHttp(monitor, startTime);

			case "TCP":
				return await checkTcp(monitor, startTime);

			case "PING":
				return await checkPing(monitor, startTime);

			case "DNS":
				return await checkDns(monitor, startTime);

			default:
				return {
					status: "DOWN",
					error: `Unsupported monitor type: ${monitor.type}`,
				};
		}
	} catch (error) {
		return {
			status: "DOWN",
			responseTime: Date.now() - startTime,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
