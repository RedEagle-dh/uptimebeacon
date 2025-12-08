"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface ResponseTimeDataPoint {
	date: string;
	avgResponseTime: number | null;
}

interface ResponseTimeChartProps {
	data: ResponseTimeDataPoint[];
	height?: string;
	className?: string;
}

const chartConfig = {
	avgResponseTime: {
		label: "Avg Response Time",
		color: "hsl(199, 89%, 48%)",
	},
} satisfies ChartConfig;

export function ResponseTimeChart({
	data,
	height = "h-[200px]",
	className,
}: ResponseTimeChartProps) {
	// Filter out null values and memoize chart data
	const chartData = useMemo(
		() =>
			data.map((point) => ({
				date: point.date,
				avgResponseTime: point.avgResponseTime ?? 0,
			})),
		[data],
	);

	// Check if there's any actual data
	const hasData = useMemo(
		() => chartData.some((point) => point.avgResponseTime > 0),
		[chartData],
	);

	// Calculate Y-axis domain based on data
	const yDomain = useMemo(() => {
		const values = chartData.map((d) => d.avgResponseTime).filter((v) => v > 0);
		if (values.length === 0) return [0, 100];
		const min = Math.min(...values);
		const max = Math.max(...values);
		const padding = (max - min) * 0.1 || 10;
		return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
	}, [chartData]);

	if (!hasData) {
		return (
			<div
				className={cn(
					"flex items-center justify-center text-muted-foreground",
					height,
					className,
				)}
			>
				No response time data available yet
			</div>
		);
	}

	return (
		<ChartContainer
			className={cn(height, "w-full", className)}
			config={chartConfig}
		>
			<AreaChart data={chartData}>
				<defs>
					<linearGradient id="responseTimeGradient" x1="0" x2="0" y1="0" y2="1">
						<stop
							offset="5%"
							stopColor="hsl(199, 89%, 48%)"
							stopOpacity={0.3}
						/>
						<stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis
					axisLine={false}
					dataKey="date"
					tickFormatter={(value) => {
						const date = new Date(value);
						return `${date.getMonth() + 1}/${date.getDate()}`;
					}}
					tickLine={false}
					tickMargin={8}
				/>
				<YAxis
					axisLine={false}
					domain={yDomain}
					tickFormatter={(value) => `${value}ms`}
					tickLine={false}
					tickMargin={8}
				/>
				<ChartTooltip
					content={
						<ChartTooltipContent
							formatter={(value) => [`${Number(value)}ms`, "Response Time"]}
						/>
					}
				/>
				<Area
					dataKey="avgResponseTime"
					fill="url(#responseTimeGradient)"
					fillOpacity={1}
					stroke="hsl(199, 89%, 48%)"
					strokeWidth={2}
					type="monotone"
				/>
			</AreaChart>
		</ChartContainer>
	);
}
