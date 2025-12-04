import { app } from "./app";
import { env } from "./env";
import { initializeAdminUser } from "./services/init-admin";
import { initScheduler } from "./services/scheduler";
import { logger } from "./utils/logger";

const port = env.PORT;

// Initialize admin user from env if configured
initializeAdminUser().catch((error) => {
	logger.error("Failed to initialize admin user:", error);
});

// Initialize the monitoring scheduler
initScheduler().catch((error) => {
	logger.error("Failed to initialize scheduler:", error);
});

app.listen(port, () => {
	logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 UptimeBeacon Backend Server                          ║
║                                                           ║
║   HTTP:      http://localhost:${port}                        ║
║   WebSocket: ws://localhost:${port}/ws                       ║
║   Health:    http://localhost:${port}/api/health             ║
║                                                           ║
║   Environment: ${env.NODE_ENV.padEnd(43)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
});
