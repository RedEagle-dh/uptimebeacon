import { Suspense } from "react";

import { IncidentsPageSkeleton } from "@/components/shared";
import { api, HydrateClient } from "@/trpc/server";

import { IncidentsClient } from "./_components/IncidentsClient";

export default async function IncidentsPage() {
	void api.incident.getAll.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<IncidentsPageSkeleton />}>
				<IncidentsClient />
			</Suspense>
		</HydrateClient>
	);
}
