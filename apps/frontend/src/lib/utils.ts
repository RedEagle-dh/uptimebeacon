import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format uptime percentage with 3 decimal places (5 nines precision)
 * Shows "100" for perfect uptime, otherwise "99.999" format
 */
export function formatUptime(uptime: number): string {
	if (uptime === 100) {
		return "100";
	}
	return uptime.toFixed(3);
}
