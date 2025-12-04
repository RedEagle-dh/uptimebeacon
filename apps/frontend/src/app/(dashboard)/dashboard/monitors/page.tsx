import { Suspense } from "react";

import { MonitorsPageSkeleton } from "@/components/shared";
import { api, HydrateClient } from "@/trpc/server";

import { MonitorsClient } from "./_components/MonitorsClient";

export default async function MonitorsPage() {
	void api.monitor.getAll.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<MonitorsPageSkeleton />}>
				<MonitorsClient />
			</Suspense>
		</HydrateClient>
	);
}
