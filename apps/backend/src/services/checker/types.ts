import type { MonitorStatus } from "@uptimebeacon/database";

export interface CheckResult {
	status: MonitorStatus;
	responseTime?: number;
	statusCode?: number;
	message?: string;
	error?: string;
	tlsValid?: boolean;
	tlsExpiry?: Date;
	tlsIssuer?: string;
	dnsResolvedIp?: string;
}
