import { Suspense } from "react";

import { StatusPagesPageSkeleton } from "@/components/shared";
import { api, HydrateClient } from "@/trpc/server";

import { StatusPagesClient } from "./_components/StatusPagesClient";

export default async function StatusPagesPage() {
	void api.statusPage.getAll.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<StatusPagesPageSkeleton />}>
				<StatusPagesClient />
			</Suspense>
		</HydrateClient>
	);
}
