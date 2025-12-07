import type { Monitor } from "@uptimebeacon/database";
import type { CheckResult } from "./types";

// SSRF protection: validate URLs to prevent access to internal resources
function isInternalUrl(urlString: string): boolean {
	try {
		const url = new URL(urlString);
		const hostname = url.hostname.toLowerCase();

		// Block localhost variations
		if (
			hostname === "localhost" ||
			hostname === "127.0.0.1" ||
			hostname === "::1" ||
			hostname === "0.0.0.0" ||
			hostname.endsWith(".localhost")
		) {
			return true;
		}

		// Block AWS/cloud metadata endpoints
		if (
			hostname === "169.254.169.254" ||
			hostname === "metadata.google.internal"
		) {
			return true;
		}

		// Block private IP ranges (IPv4)
		const ipv4Match = hostname.match(
			/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
		);
		if (ipv4Match) {
			const [, a, b] = ipv4Match.map(Number);
			// 10.0.0.0/8
			if (a === 10) return true;
			// 172.16.0.0/12
			if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
			// 192.168.0.0/16
			if (a === 192 && b === 168) return true;
			// 127.0.0.0/8 (loopback)
			if (a === 127) return true;
			// 169.254.0.0/16 (link-local)
			if (a === 169 && b === 254) return true;
		}

		// Block non-HTTP(S) protocols
		if (!["http:", "https:"].includes(url.protocol)) {
			return true;
		}

		return false;
	} catch {
		// Invalid URL
		return true;
	}
}

export async function checkHttp(
	monitor: Monitor,
	startTime: number,
): Promise<CheckResult> {
	// SSRF validation - block requests to internal resources
	if (!monitor.url || isInternalUrl(monitor.url)) {
		return {
			status: "DOWN",
			responseTime: 0,
			error: "Invalid or blocked URL: internal resources are not allowed",
		};
	}

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
