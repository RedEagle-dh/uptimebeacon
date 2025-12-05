import { Elysia, t } from "elysia";
import {
	checkForUpdates,
	dismissUpdate,
	getCurrentVersion,
	getUpdateSettings,
	getUpdateStatus,
	updateUpdateSettings,
} from "../services/version";

export const versionRoutes = new Elysia({ prefix: "/api/version" })
	// Get current version info
	.get("/", async () => {
		const status = await getUpdateStatus();
		return {
			version: getCurrentVersion(),
			latest: status.latest,
			updateAvailable: status.updateAvailable,
			updateType: status.updateType,
			releaseUrl: status.releaseUrl,
			lastCheckedAt: status.lastCheckedAt?.toISOString() || null,
		};
	})

	// Trigger manual update check
	.post("/check", async () => {
		const result = await checkForUpdates();
		const status = await getUpdateStatus();
		return {
			success: true,
			frontendLatest: result.frontendLatest,
			backendLatest: result.backendLatest,
			updateAvailable: result.updateAvailable,
			current: getCurrentVersion(),
			releaseUrl: status.releaseUrl,
		};
	})

	// Get cached latest version info
	.get("/latest", async () => {
		const status = await getUpdateStatus();
		return {
			current: status.current,
			latest: status.latest,
			updateAvailable: status.updateAvailable,
			updateType: status.updateType,
			releaseUrl: status.releaseUrl,
			lastCheckedAt: status.lastCheckedAt?.toISOString() || null,
		};
	})

	// Get update settings
	.get("/settings", async () => {
		const settings = await getUpdateSettings();
		return settings;
	})

	// Update settings
	.patch(
		"/settings",
		async ({ body }) => {
			const updated = await updateUpdateSettings(body);
			return {
				success: true,
				settings: {
					autoCheck: updated.autoCheck,
					checkIntervalSeconds: updated.checkIntervalSeconds,
				},
			};
		},
		{
			body: t.Object({
				autoCheck: t.Optional(t.Boolean()),
				checkIntervalSeconds: t.Optional(t.Number()),
			}),
		},
	)

	// Dismiss update notification
	.post(
		"/dismiss",
		async ({ body }) => {
			await dismissUpdate(body.version);
			return { success: true };
		},
		{
			body: t.Object({
				version: t.String(),
			}),
		},
	);
