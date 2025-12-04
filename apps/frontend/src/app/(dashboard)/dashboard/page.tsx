import { Suspense } from "react";

import { DashboardPageSkeleton } from "@/components/shared";
import { api, HydrateClient } from "@/trpc/server";

import { DashboardClient } from "./_components/DashboardClient";

export default async function DashboardPage() {
	void api.monitor.getStats.prefetch();
	void api.monitor.getAll.prefetch();
	void api.incident.getAll.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<DashboardPageSkeleton />}>
				<DashboardClient />
			</Suspense>
		</HydrateClient>
	);
}
