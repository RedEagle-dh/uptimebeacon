"use client";

import { api } from "@/trpc/react";

import { MonitorFormClient } from "../../../new/_components/NewMonitorClient";

interface EditMonitorClientProps {
	id: string;
}

export function EditMonitorClient({ id }: EditMonitorClientProps) {
	const { data: monitor, isLoading } = api.monitor.getById.useQuery({ id });

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-muted-foreground">Loading monitor...</div>
			</div>
		);
	}

	if (!monitor) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-muted-foreground">Monitor not found</div>
			</div>
		);
	}

	return <MonitorFormClient monitor={monitor} />;
}
