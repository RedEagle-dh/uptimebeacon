import type { Monitor } from "@uptimebeacon/database";
import type { CheckResult } from "./types";

// Validate port range
function isValidPort(port: number): boolean {
	return Number.isInteger(port) && port >= 1 && port <= 65535;
}

// Validate hostname format
function isValidHostname(hostname: string): boolean {
	const domainRegex =
		/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
	const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

	if (hostname.length > 253) return false;
	if (/[;&|`$"'\\<>(){}[\]\n\r\t]/.test(hostname)) return false;

	return domainRegex.test(hostname) || ipv4Regex.test(hostname);
}

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

	// Validate hostname and port
	if (!isValidHostname(monitor.hostname)) {
		return {
			status: "DOWN",
			error: "Invalid hostname format",
		};
	}

	if (!isValidPort(monitor.port)) {
		return {
			status: "DOWN",
			error: "Invalid port number (must be 1-65535)",
		};
	}

	try {
		// Create a promise that rejects after timeout
		const timeoutMs = monitor.timeout * 1000;
		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error("Connection timed out")), timeoutMs);
		});

		// Create the connection promise
		const connectionPromise = new Promise<void>((resolve, reject) => {
			try {
				const socket = Bun.connect({
					hostname: monitor.hostname!,
					port: monitor.port!,
					socket: {
						data() {},
						open(socket) {
							socket.end();
							resolve();
						},
						close() {},
						error(_socket, error) {
							reject(error);
						},
						connectError(_socket, error) {
							reject(error);
						},
					},
				});

				// Handle synchronous errors
				if (!socket) {
					reject(new Error("Failed to create socket"));
				}
			} catch (err) {
				reject(err);
			}
		});

		// Race between connection and timeout
		await Promise.race([connectionPromise, timeoutPromise]);

		const responseTime = Date.now() - startTime;
		return {
			status: "UP",
			responseTime,
			message: `TCP connection to ${monitor.hostname}:${monitor.port} successful`,
		};
	} catch (error) {
		return {
			status: "DOWN",
			responseTime: Date.now() - startTime,
			error: error instanceof Error ? error.message : "TCP connection failed",
		};
	}
}
