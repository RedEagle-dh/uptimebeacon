import { Suspense } from "react";

import { StatusPageDetailSkeleton } from "@/components/shared/skeletons";
import { api, HydrateClient } from "@/trpc/server";

import { StatusPageDetailClient } from "./_components/StatusPageDetailClient";

export default async function StatusPageDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	void api.statusPage.getById.prefetch({ id });
	void api.monitor.getAll.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<StatusPageDetailSkeleton />}>
				<StatusPageDetailClient id={id} />
			</Suspense>
		</HydrateClient>
	);
}
