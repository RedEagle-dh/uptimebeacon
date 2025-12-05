import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	publicProcedure,
} from "@/server/api/trpc";

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

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
		const response = await fetch(`${BACKEND_URL}/api/version/check`, {
			method: "POST",
		});

		if (!response.ok) {
			throw new Error(`Backend returned ${response.status}`);
		}

		const data = (await response.json()) as CheckResponse;
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
		const response = await fetch(`${BACKEND_URL}/api/version/settings`);

		if (!response.ok) {
			throw new Error(`Backend returned ${response.status}`);
		}

		const data = (await response.json()) as SettingsResponse;
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
			const response = await fetch(`${BACKEND_URL}/api/version/settings`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
			});

			if (!response.ok) {
				throw new Error(`Backend returned ${response.status}`);
			}

			return { success: true };
		}),

	/**
	 * Dismiss update notification for a specific version (admin only)
	 */
	dismissUpdate: adminProcedure
		.input(z.object({ version: z.string() }))
		.mutation(async ({ input }) => {
			const response = await fetch(`${BACKEND_URL}/api/version/dismiss`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ version: input.version }),
			});

			if (!response.ok) {
				throw new Error(`Backend returned ${response.status}`);
			}

			return { success: true };
		}),
});
