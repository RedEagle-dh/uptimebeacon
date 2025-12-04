import { db } from "@uptimebeacon/database";
import bcrypt from "bcryptjs";

import { env } from "../env";
import { logger } from "../utils/logger";

export async function initializeAdminUser() {
	const adminEmail = env.INITIAL_ADMIN_EMAIL;
	const adminPassword = env.INITIAL_ADMIN_PASSWORD;

	// Skip if env vars are not set or empty
	if (!adminEmail?.trim() || !adminPassword?.trim()) {
		logger.info(
			"No initial admin credentials configured. First registered user will become admin.",
		);
		return;
	}

	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(adminEmail)) {
		logger.error(
			"INITIAL_ADMIN_EMAIL is not a valid email address. Skipping admin initialization.",
		);
		return;
	}

	// Validate password length
	if (adminPassword.length < 8) {
		logger.error(
			"INITIAL_ADMIN_PASSWORD must be at least 8 characters. Skipping admin initialization.",
		);
		return;
	}

	try {
		// Check if any users exist
		const userCount = await db.user.count();

		if (userCount > 0) {
			logger.info("Users already exist, skipping admin initialization.");
			return;
		}

		// Create the admin user
		const hashedPassword = await bcrypt.hash(adminPassword, 12);

		await db.user.create({
			data: {
				name: "Admin",
				email: adminEmail,
				password: hashedPassword,
				role: "ADMIN",
			},
		});

		logger.info(`Admin user created with email: ${adminEmail}`);
	} catch (error) {
		logger.error("Failed to initialize admin user:", error);
	}
}
