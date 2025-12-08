"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Monitor {
	id: string;
	name: string;
}

interface MonitorSelectorProps {
	monitors: Monitor[];
	selectedMonitorId: string;
	onSelect: (monitorId: string) => void;
	className?: string;
}

export function MonitorSelector({
	monitors,
	selectedMonitorId,
	onSelect,
	className,
}: MonitorSelectorProps) {
	if (monitors.length === 0) {
		return null;
	}

	return (
		<Select onValueChange={onSelect} value={selectedMonitorId}>
			<SelectTrigger className={cn("w-[180px]", className)} size="sm">
				<SelectValue placeholder="Select monitor" />
			</SelectTrigger>
			<SelectContent>
				{monitors.map((monitor) => (
					<SelectItem key={monitor.id} value={monitor.id}>
						{monitor.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
