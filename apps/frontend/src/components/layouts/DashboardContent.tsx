"use client";

import { useState } from "react";
import { UpdateBanner } from "@/components/shared/UpdateBanner";
import { UpdateInstructions } from "@/components/shared/UpdateInstructions";
import { api } from "@/trpc/react";

interface DashboardContentProps {
	children: React.ReactNode;
	isAdmin: boolean;
}

export function DashboardContent({ children, isAdmin }: DashboardContentProps) {
	const [showInstructions, setShowInstructions] = useState(false);

	const { data: status } = api.update.getStatus.useQuery(undefined, {
		enabled: isAdmin,
		staleTime: 1000 * 60 * 5,
	});

	return (
		<>
			{isAdmin && (
				<UpdateBanner
					isAdmin={isAdmin}
					onViewDetails={() => setShowInstructions(true)}
				/>
			)}
			{children}
			{isAdmin && (
				<UpdateInstructions
					currentVersion={status?.currentVersion ?? "0.1.0"}
					latestVersion={status?.latestVersion ?? null}
					onOpenChange={setShowInstructions}
					open={showInstructions}
					releaseUrl={status?.releaseUrl ?? null}
				/>
			)}
		</>
	);
}
