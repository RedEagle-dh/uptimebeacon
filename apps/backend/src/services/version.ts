import { db } from "@uptimebeacon/database";
import { logger } from "../utils/logger";

// Get version from environment (injected at Docker build time)
const APP_VERSION = process.env.APP_VERSION || "0.1.0";

// GitHub Container Registry API base URL
// Use GHCR_REPO env var for flexibility, default to repository owner/name pattern
const GHCR_REPO = process.env.GHCR_REPO || "redeagle-dh/uptimebeacon";
const GHCR_API_BASE = `https://ghcr.io/v2/${GHCR_REPO}`;

interface VersionInfo {
	current: string;
	latest: string | null;
	updateAvailable: boolean;
	updateType: "major" | "minor" | "patch" | null;
	releaseUrl: string | null;
	lastCheckedAt: Date | null;
}

interface RegistryTagsResponse {
	name: string;
	tags: string[];
}

/**
 * Get the current application version
 */
export function getCurrentVersion(): string {
	return APP_VERSION;
}

/**
 * Parse a semantic version string into components
 */
function parseVersion(version: string): {
	major: number;
	minor: number;
	patch: number;
} | null {
	// Handle versions with or without 'v' prefix
	const cleaned = version.replace(/^v/, "");
	const match = cleaned.match(/^(\d+)\.(\d+)\.(\d+)/);
	if (!match) return null;

	return {
		major: Number.parseInt(match[1] ?? "0", 10),
		minor: Number.parseInt(match[2] ?? "0", 10),
		patch: Number.parseInt(match[3] ?? "0", 10),
	};
}

/**
 * Compare two version strings
 * Returns: 'major', 'minor', 'patch' if latest is newer, null if same or older
 */
export function compareVersions(
	current: string,
	latest: string,
): "major" | "minor" | "patch" | null {
	const currentParsed = parseVersion(current);
	const latestParsed = parseVersion(latest);

	if (!currentParsed || !latestParsed) return null;

	if (latestParsed.major > currentParsed.major) return "major";
	if (
		latestParsed.major === currentParsed.major &&
		latestParsed.minor > currentParsed.minor
	)
		return "minor";
	if (
		latestParsed.major === currentParsed.major &&
		latestParsed.minor === currentParsed.minor &&
		latestParsed.patch > currentParsed.patch
	)
		return "patch";

	return null;
}

/**
 * Find the latest semantic version from a list of tags
 * Supports formats: v1.0.0, 1.0.0, frontend-v1.0.0, backend-v1.0.0
 */
function findLatestVersion(
	tags: string[],
	prefix?: "frontend" | "backend",
): string | null {
	logger.debug(`Available tags: ${tags.join(", ")}`);

	// Extract version from tag, handling different formats
	const extractVersion = (
		tag: string,
	): { original: string; version: string } | null => {
		// Match prefixed tags like frontend-v1.0.0 or backend-v1.0.0
		if (prefix) {
			const prefixMatch = tag.match(
				new RegExp(`^${prefix}-v?(\\d+\\.\\d+\\.\\d+)$`),
			);
			if (prefixMatch?.[1]) return { original: tag, version: prefixMatch[1] };
		}
		// Match standard semver tags like v1.0.0 or 1.0.0
		const semverMatch = tag.match(/^v?(\d+\.\d+\.\d+)$/);
		if (semverMatch?.[1]) return { original: tag, version: semverMatch[1] };
		return null;
	};

	const semverTags = tags
		.map(extractVersion)
		.filter((t): t is { original: string; version: string } => t !== null)
		.map((t) => ({
			...t,
			parsed: parseVersion(t.version),
		}))
		.filter((t) => t.parsed !== null)
		.sort((a, b) => {
			const ap = a.parsed!;
			const bp = b.parsed!;
			if (ap.major !== bp.major) return bp.major - ap.major;
			if (ap.minor !== bp.minor) return bp.minor - ap.minor;
			return bp.patch - ap.patch;
		});

	const latest = semverTags[0];
	if (latest) {
		logger.debug(`Latest ${prefix || "global"} version: ${latest.version}`);
	}
	return latest?.version || null;
}

/**
 * Fetch available tags from GitHub Container Registry
 */
async function fetchRegistryTags(
	image: "frontend" | "backend",
): Promise<string[]> {
	try {
		const response = await fetch(`${GHCR_API_BASE}/${image}/tags/list`, {
			headers: {
				Accept: "application/json",
			},
		});

		if (!response.ok) {
			// If unauthorized, try anonymous token auth (required for GHCR public images)
			if (response.status === 401) {
				logger.debug(
					`Registry returned 401 for ${image}, fetching anonymous token`,
				);
				// GHCR requires a token even for public images
				const tokenUrl = `https://ghcr.io/token?service=ghcr.io&scope=repository:${GHCR_REPO}/${image}:pull`;
				const tokenResponse = await fetch(tokenUrl);
				if (tokenResponse.ok) {
					const tokenData = (await tokenResponse.json()) as { token: string };
					const authedResponse = await fetch(
						`${GHCR_API_BASE}/${image}/tags/list`,
						{
							headers: {
								Accept: "application/json",
								Authorization: `Bearer ${tokenData.token}`,
							},
						},
					);
					if (authedResponse.ok) {
						const data = (await authedResponse.json()) as RegistryTagsResponse;
						logger.debug(`Found ${data.tags?.length || 0} tags for ${image}`);
						return data.tags || [];
					}
					logger.warn(
						`Failed to fetch ${image} tags after auth: ${authedResponse.status}`,
					);
				} else {
					logger.warn(
						`Failed to get token for ${image}: ${tokenResponse.status}`,
					);
				}
			}
			logger.warn(`Failed to fetch ${image} tags: ${response.status}`);
			return [];
		}

		const data = (await response.json()) as RegistryTagsResponse;
		return data.tags || [];
	} catch (error) {
		logger.error(`Error fetching ${image} registry tags:`, error);
		return [];
	}
}

/**
 * Check for updates from Docker registry
 */
export async function checkForUpdates(): Promise<{
	frontendLatest: string | null;
	backendLatest: string | null;
	updateAvailable: boolean;
}> {
	logger.info("Checking for updates from Docker registry...");

	const [frontendTags, backendTags] = await Promise.all([
		fetchRegistryTags("frontend"),
		fetchRegistryTags("backend"),
	]);

	// Look for prefixed tags first (frontend-v1.0.0), fall back to standard semver
	const frontendLatest =
		findLatestVersion(frontendTags, "frontend") ||
		findLatestVersion(frontendTags);
	const backendLatest =
		findLatestVersion(backendTags, "backend") || findLatestVersion(backendTags);

	const currentVersion = getCurrentVersion();
	const frontendUpdate = frontendLatest
		? compareVersions(currentVersion, frontendLatest)
		: null;
	const backendUpdate = backendLatest
		? compareVersions(currentVersion, backendLatest)
		: null;

	const updateAvailable = frontendUpdate !== null || backendUpdate !== null;

	// Update cache in database
	try {
		await db.updateSettings.upsert({
			where: { id: "default" },
			create: {
				id: "default",
				lastCheckAt: new Date(),
				latestFrontendVersion: frontendLatest,
				latestBackendVersion: backendLatest,
				currentFrontendVersion: currentVersion,
				currentBackendVersion: currentVersion,
				latestReleaseUrl: frontendLatest
					? `https://github.com/${GHCR_REPO}/releases/tag/${frontendLatest}`
					: null,
			},
			update: {
				lastCheckAt: new Date(),
				latestFrontendVersion: frontendLatest,
				latestBackendVersion: backendLatest,
				currentFrontendVersion: currentVersion,
				currentBackendVersion: currentVersion,
				latestReleaseUrl: frontendLatest
					? `https://github.com/${GHCR_REPO}/releases/tag/${frontendLatest}`
					: null,
			},
		});
	} catch (error) {
		logger.error("Failed to update version cache:", error);
	}

	logger.info(
		`Update check complete. Frontend: ${currentVersion} -> ${frontendLatest || "unknown"}, Backend: ${currentVersion} -> ${backendLatest || "unknown"}`,
	);

	return {
		frontendLatest,
		backendLatest,
		updateAvailable,
	};
}

/**
 * Get update status from cache or check if stale
 */
export async function getUpdateStatus(): Promise<VersionInfo> {
	const settings = await db.updateSettings.findUnique({
		where: { id: "default" },
	});

	const currentVersion = getCurrentVersion();

	// Use the higher version between frontend and backend as "latest"
	let latestVersion: string | null = null;
	if (settings?.latestFrontendVersion && settings?.latestBackendVersion) {
		const frontendParsed = parseVersion(settings.latestFrontendVersion);
		const backendParsed = parseVersion(settings.latestBackendVersion);
		if (frontendParsed && backendParsed) {
			if (
				frontendParsed.major > backendParsed.major ||
				(frontendParsed.major === backendParsed.major &&
					frontendParsed.minor > backendParsed.minor) ||
				(frontendParsed.major === backendParsed.major &&
					frontendParsed.minor === backendParsed.minor &&
					frontendParsed.patch > backendParsed.patch)
			) {
				latestVersion = settings.latestFrontendVersion;
			} else {
				latestVersion = settings.latestBackendVersion;
			}
		}
	} else {
		latestVersion =
			settings?.latestFrontendVersion || settings?.latestBackendVersion || null;
	}

	const updateType = latestVersion
		? compareVersions(currentVersion, latestVersion)
		: null;

	return {
		current: currentVersion,
		latest: latestVersion,
		updateAvailable: updateType !== null,
		updateType,
		releaseUrl: settings?.latestReleaseUrl || null,
		lastCheckedAt: settings?.lastCheckAt || null,
	};
}

/**
 * Get update settings
 */
export async function getUpdateSettings() {
	const settings = await db.updateSettings.findUnique({
		where: { id: "default" },
	});

	if (!settings) {
		// Return defaults
		return {
			autoCheck: true,
			checkIntervalSeconds: 21600,
			dismissedVersion: null,
		};
	}

	return {
		autoCheck: settings.autoCheck,
		checkIntervalSeconds: settings.checkIntervalSeconds,
		dismissedVersion: settings.dismissedVersion,
	};
}

/**
 * Update settings
 */
export async function updateUpdateSettings(data: {
	autoCheck?: boolean;
	checkIntervalSeconds?: number;
}) {
	return db.updateSettings.upsert({
		where: { id: "default" },
		create: {
			id: "default",
			...data,
			currentFrontendVersion: getCurrentVersion(),
			currentBackendVersion: getCurrentVersion(),
		},
		update: data,
	});
}

/**
 * Dismiss update notification for a specific version
 */
export async function dismissUpdate(version: string) {
	return db.updateSettings.upsert({
		where: { id: "default" },
		create: {
			id: "default",
			dismissedVersion: version,
			currentFrontendVersion: getCurrentVersion(),
			currentBackendVersion: getCurrentVersion(),
		},
		update: {
			dismissedVersion: version,
		},
	});
}

// Update check interval timer
let updateCheckTimer: Timer | null = null;

/**
 * Initialize scheduled update checks
 */
export async function initUpdateChecker(): Promise<void> {
	const settings = await getUpdateSettings();

	if (!settings.autoCheck) {
		logger.info("Automatic update checks disabled");
		return;
	}

	// Run initial check after a short delay
	setTimeout(() => {
		checkForUpdates().catch((err) =>
			logger.error("Initial update check failed:", err),
		);
	}, 10000); // 10 seconds after startup

	// Schedule recurring checks
	const intervalMs = settings.checkIntervalSeconds * 1000;
	updateCheckTimer = setInterval(() => {
		checkForUpdates().catch((err) =>
			logger.error("Scheduled update check failed:", err),
		);
	}, intervalMs);

	logger.info(
		`Update checker initialized (interval: ${settings.checkIntervalSeconds}s)`,
	);
}

/**
 * Stop scheduled update checks
 */
export function stopUpdateChecker(): void {
	if (updateCheckTimer) {
		clearInterval(updateCheckTimer);
		updateCheckTimer = null;
		logger.info("Update checker stopped");
	}
}
