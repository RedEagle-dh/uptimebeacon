"use client";

import { UpdateBanner } from "@/components/shared/UpdateBanner";
import { UpdateInstructions } from "@/components/shared/UpdateInstructions";
import { api } from "@/trpc/react";
import { useState } from "react";

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
				<UpdateBanner isAdmin={isAdmin} onViewDetails={() => setShowInstructions(true)} />
			)}
			{children}
			{isAdmin && (
				<UpdateInstructions
					open={showInstructions}
					onOpenChange={setShowInstructions}
					currentVersion={status?.currentVersion ?? "0.1.0"}
					latestVersion={status?.latestVersion ?? null}
					releaseUrl={status?.releaseUrl ?? null}
				/>
			)}
		</>
	);
}
