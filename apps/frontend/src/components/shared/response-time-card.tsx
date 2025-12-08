"use client";

import { useMemo, useState } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MonitorSelector } from "./monitor-selector";
import { ResponseTimeChart } from "./response-time-chart";

interface ResponseTimeData {
	monitorId: string;
	monitorName: string;
	data: Array<{
		date: string;
		avgResponseTime: number | null;
	}>;
}

interface ResponseTimeCardProps {
	responseTimeHistory: ResponseTimeData[];
	daysToShow: number;
	className?: string;
}

export function ResponseTimeCard({
	responseTimeHistory,
	daysToShow,
	className,
}: ResponseTimeCardProps) {
	// Get list of monitors from response time history
	const monitors = useMemo(
		() =>
			responseTimeHistory.map((item) => ({
				id: item.monitorId,
				name: item.monitorName,
			})),
		[responseTimeHistory],
	);

	// State for selected monitor - default to first monitor
	const [selectedMonitorId, setSelectedMonitorId] = useState<string>(
		monitors[0]?.id ?? "",
	);

	// Get chart data for selected monitor
	const chartData = useMemo(() => {
		const selected = responseTimeHistory.find(
			(item) => item.monitorId === selectedMonitorId,
		);
		return selected?.data ?? [];
	}, [responseTimeHistory, selectedMonitorId]);

	if (monitors.length === 0) {
		return null;
	}

	return (
		<Card className={cn(className)}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<div>
					<CardTitle>Response Time</CardTitle>
					<CardDescription>
						Average response time over the last {daysToShow} days
					</CardDescription>
				</div>
				{monitors.length > 1 && (
					<MonitorSelector
						monitors={monitors}
						onSelect={setSelectedMonitorId}
						selectedMonitorId={selectedMonitorId}
					/>
				)}
			</CardHeader>
			<CardContent>
				<ResponseTimeChart data={chartData} />
			</CardContent>
		</Card>
	);
}
