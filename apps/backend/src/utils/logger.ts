type LogLevel = "info" | "warn" | "error" | "debug";

const colors = {
	info: "\x1b[36m", // cyan
	warn: "\x1b[33m", // yellow
	error: "\x1b[31m", // red
	debug: "\x1b[90m", // gray
	reset: "\x1b[0m",
};

function formatMessage(level: LogLevel, message: string, ...args: unknown[]) {
	const timestamp = new Date().toISOString();
	const color = colors[level];
	const prefix = `${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset}`;
	return { prefix, message, args };
}

export const logger = {
	info: (message: string, ...args: unknown[]) => {
		const { prefix } = formatMessage("info", message, ...args);
		console.log(prefix, message, ...args);
	},
	warn: (message: string, ...args: unknown[]) => {
		const { prefix } = formatMessage("warn", message, ...args);
		console.warn(prefix, message, ...args);
	},
	error: (message: string, ...args: unknown[]) => {
		const { prefix } = formatMessage("error", message, ...args);
		console.error(prefix, message, ...args);
	},
	debug: (message: string, ...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			const { prefix } = formatMessage("debug", message, ...args);
			console.log(prefix, message, ...args);
		}
	},
};
