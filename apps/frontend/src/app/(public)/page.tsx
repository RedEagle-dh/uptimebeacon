import { Suspense } from "react";

import { PublicStatusPageSkeleton } from "@/components/shared";
import { api, HydrateClient } from "@/trpc/server";

import { PublicStatusClient } from "./_components/PublicStatusClient";

export default async function StatusPage() {
	void api.statusPage.getPublicOverview.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<PublicStatusPageSkeleton />}>
				<PublicStatusClient />
			</Suspense>
		</HydrateClient>
	);
}
