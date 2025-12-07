import type { Monitor } from "@uptimebeacon/database";
import type { CheckResult } from "./types";

export async function checkHttp(
	monitor: Monitor,
	startTime: number,
): Promise<CheckResult> {
	const controller = new AbortController();
	const timeoutId = setTimeout(
		() => controller.abort(),
		monitor.timeout * 1000,
	);

	try {
		const headers: Record<string, string> = {};

		// Add custom headers
		if (monitor.headers && typeof monitor.headers === "object") {
			Object.assign(headers, monitor.headers);
		}

		// Add authentication
		if (
			monitor.authMethod === "basic" &&
			monitor.authUser &&
			monitor.authPass
		) {
			headers.Authorization = `Basic ${btoa(`${monitor.authUser}:${monitor.authPass}`)}`;
		} else if (monitor.authMethod === "bearer" && monitor.authToken) {
			headers.Authorization = `Bearer ${monitor.authToken}`;
		}

		const response = await fetch(monitor.url!, {
			method: monitor.method,
			headers,
			body: ["POST", "PUT", "PATCH"].includes(monitor.method)
				? monitor.body
				: undefined,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);
		const responseTime = Date.now() - startTime;

		// Check status code
		const expectedCodes = monitor.expectedStatusCodes ?? [200, 201, 204];
		const statusOk = expectedCodes.includes(response.status);

		// Keyword check
		if (monitor.type === "KEYWORD" && monitor.keyword) {
			const text = await response.text();
			const keywordFound = text.includes(monitor.keyword);
			const shouldBePresent = monitor.keywordType !== "absent";

			if (keywordFound !== shouldBePresent) {
				return {
					status: "DOWN",
					responseTime,
					statusCode: response.status,
					error: shouldBePresent
						? `Keyword "${monitor.keyword}" not found`
						: `Keyword "${monitor.keyword}" found but should be absent`,
				};
			}
		}

		// JSON Query check
		if (monitor.type === "JSON_QUERY" && monitor.jsonPath) {
			const json = await response.json();
			const value = getJsonPath(json, monitor.jsonPath);

			if (monitor.expectedValue && String(value) !== monitor.expectedValue) {
				return {
					status: "DOWN",
					responseTime,
					statusCode: response.status,
					error: `JSON value mismatch: expected "${monitor.expectedValue}", got "${value}"`,
				};
			}
		}

		return {
			status: statusOk ? "UP" : "DOWN",
			responseTime,
			statusCode: response.status,
			message: statusOk ? "OK" : `Unexpected status: ${response.status}`,
		};
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof Error && error.name === "AbortError") {
			return {
				status: "DOWN",
				responseTime: monitor.timeout * 1000,
				error: "Request timed out",
			};
		}

		return {
			status: "DOWN",
			responseTime: Date.now() - startTime,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

function getJsonPath(obj: unknown, path: string): unknown {
	const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
	let current = obj;

	for (const part of parts) {
		if (current == null) return undefined;
		current = (current as Record<string, unknown>)[part];
	}

	return current;
}
