import { Suspense } from "react";

import { IncidentDetailSkeleton } from "@/components/shared/skeletons";
import { api, HydrateClient } from "@/trpc/server";

import { IncidentDetailClient } from "./_components/IncidentDetailClient";

export default async function IncidentDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	void api.incident.getById.prefetch({ id });

	return (
		<HydrateClient>
			<Suspense fallback={<IncidentDetailSkeleton />}>
				<IncidentDetailClient id={id} />
			</Suspense>
		</HydrateClient>
	);
}
