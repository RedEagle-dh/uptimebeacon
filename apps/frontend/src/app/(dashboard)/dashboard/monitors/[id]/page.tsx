import { Suspense } from "react";

import { MonitorDetailSkeleton } from "@/components/shared/skeletons";
import { api, HydrateClient } from "@/trpc/server";

import { MonitorDetailClient } from "./_components/MonitorDetailClient";

export default async function MonitorDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	void api.monitor.getById.prefetch({ id });
	void api.monitor.getUptimeData.prefetch({ monitorId: id, days: 30 });

	return (
		<HydrateClient>
			<Suspense fallback={<MonitorDetailSkeleton />}>
				<MonitorDetailClient id={id} />
			</Suspense>
		</HydrateClient>
	);
}
