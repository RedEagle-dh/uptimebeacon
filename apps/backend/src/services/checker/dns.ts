import type { Monitor } from "@uptimebeacon/database";
import type { CheckResult } from "./types";

export async function checkDns(
	monitor: Monitor,
	startTime: number,
): Promise<CheckResult> {
	if (!monitor.hostname) {
		return {
			status: "DOWN",
			error: "Hostname is required for DNS checks",
		};
	}

	try {
		const addresses = await Bun.dns.lookup(monitor.hostname, { family: 4 });
		const responseTime = Date.now() - startTime;

		if (addresses && addresses.length > 0) {
			const resolvedIp = addresses[0]?.address;

			if (!resolvedIp) {
				return {
					status: "DOWN",
					responseTime,
					error: `DNS resolution for ${monitor.hostname} returned empty address`,
				};
			}

			// If expected value is set, check if the resolved IP matches
			if (monitor.expectedValue && resolvedIp !== monitor.expectedValue) {
				return {
					status: "DOWN",
					responseTime,
					dnsResolvedIp: resolvedIp,
					error: `DNS resolved to ${resolvedIp}, expected ${monitor.expectedValue}`,
				};
			}

			return {
				status: "UP",
				responseTime,
				dnsResolvedIp: resolvedIp,
				message: `DNS resolved ${monitor.hostname} to ${resolvedIp}`,
			};
		}

		return {
			status: "DOWN",
			responseTime,
			error: `DNS resolution for ${monitor.hostname} returned no results`,
		};
	} catch (error) {
		return {
			status: "DOWN",
			responseTime: Date.now() - startTime,
			error: error instanceof Error ? error.message : "DNS resolution failed",
		};
	}
}
