import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { env } from "@/env";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure,
} from "@/server/api/trpc";

// Backend API URL
const BACKEND_URL = env.BACKEND_URL ?? "http://localhost:3001";
// Timeout for backend requests (5 seconds)
const FETCH_TIMEOUT_MS = 5000;

interface VersionResponse {
	version: string;
	latest: string | null;
	updateAvailable: boolean;
	updateType: "major" | "minor" | "patch" | null;
	releaseUrl: string | null;
	lastCheckedAt: string | null;
}

interface CheckResponse {
	success: boolean;
	frontendLatest: string | null;
	backendLatest: string | null;
	updateAvailable: boolean;
	current: string;
	releaseUrl: string | null;
}

interface SettingsResponse {
	autoCheck: boolean;
	checkIntervalSeconds: number;
	dismissedVersion: string | null;
}

// Helper function for fetch with timeout and proper error handling
async function fetchWithTimeout<T>(
	url: string,
	options: RequestInit = {},
): Promise<T> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: `Backend returned ${response.status}`,
			});
		}

		// Validate content-type is JSON
		const contentType = response.headers.get("content-type");
		if (!contentType?.includes("application/json")) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Backend returned non-JSON response",
			});
		}

		// Parse JSON with error handling
		try {
			return (await response.json()) as T;
		} catch {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to parse backend response",
			});
		}
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof TRPCError) {
			throw error;
		}

		if (error instanceof Error && error.name === "AbortError") {
			throw new TRPCError({
				code: "TIMEOUT",
				message: "Backend request timed out",
			});
		}

		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message:
				error instanceof Error ? error.message : "Failed to connect to backend",
		});
	}
}

export const updateRouter = createTRPCRouter({
	/**
	 * Get current version and update status
	 * Public so it can be shown in the banner
	 */
	getStatus: publicProcedure.query(async () => {
		try {
			const response = await fetch(`${BACKEND_URL}/api/version`);
			if (!response.ok) {
				throw new Error(`Backend returned ${response.status}`);
			}
			const data = (await response.json()) as VersionResponse;

			// Also get settings to check if version was dismissed
			const settingsResponse = await fetch(
				`${BACKEND_URL}/api/version/settings`,
			);
			const settings = settingsResponse.ok
				? ((await settingsResponse.json()) as SettingsResponse)
				: null;

			return {
				currentVersion: data.version,
				latestVersion: data.latest,
				updateAvailable: data.updateAvailable,
				updateType: data.updateType,
				releaseUrl: data.releaseUrl,
				lastCheckedAt: data.lastCheckedAt,
				dismissedVersion: settings?.dismissedVersion || null,
			};
		} catch (error) {
			console.error("Failed to fetch version status:", error);
			// Return a safe default
			return {
				currentVersion: process.env.APP_VERSION || "0.1.0",
				latestVersion: null,
				updateAvailable: false,
				updateType: null,
				releaseUrl: null,
				lastCheckedAt: null,
				dismissedVersion: null,
			};
		}
	}),

	/**
	 * Trigger manual update check (admin only)
	 */
	checkNow: adminProcedure.mutation(async () => {
		const data = await fetchWithTimeout<CheckResponse>(
			`${BACKEND_URL}/api/version/check`,
			{ method: "POST" },
		);

		return {
			success: data.success,
			frontendLatest: data.frontendLatest,
			backendLatest: data.backendLatest,
			updateAvailable: data.updateAvailable,
			currentVersion: data.current,
			releaseUrl: data.releaseUrl,
		};
	}),

	/**
	 * Get update settings (admin only)
	 */
	getSettings: adminProcedure.query(async () => {
		const data = await fetchWithTimeout<SettingsResponse>(
			`${BACKEND_URL}/api/version/settings`,
		);

		return {
			autoCheck: data.autoCheck,
			checkIntervalSeconds: data.checkIntervalSeconds,
			dismissedVersion: data.dismissedVersion,
		};
	}),

	/**
	 * Update settings (admin only)
	 */
	updateSettings: adminProcedure
		.input(
			z.object({
				autoCheck: z.boolean().optional(),
				checkIntervalSeconds: z.number().min(3600).max(86400).optional(), // 1 hour to 24 hours
			}),
		)
		.mutation(async ({ input }) => {
			await fetchWithTimeout<{ success: boolean }>(
				`${BACKEND_URL}/api/version/settings`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				},
			);

			return { success: true };
		}),

	/**
	 * Dismiss update notification for a specific version (admin only)
	 */
	dismissUpdate: adminProcedure
		.input(z.object({ version: z.string().max(50) }))
		.mutation(async ({ input }) => {
			await fetchWithTimeout<{ success: boolean }>(
				`${BACKEND_URL}/api/version/dismiss`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ version: input.version }),
				},
			);

			return { success: true };
		}),
});
