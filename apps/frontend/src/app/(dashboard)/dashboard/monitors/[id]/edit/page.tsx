import { Suspense } from "react";

import { MonitorDetailSkeleton } from "@/components/shared/skeletons";
import { api, HydrateClient } from "@/trpc/server";

import { EditMonitorClient } from "./_components/EditMonitorClient";

export default async function EditMonitorPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	void api.monitor.getById.prefetch({ id });

	return (
		<HydrateClient>
			<Suspense fallback={<MonitorDetailSkeleton />}>
				<EditMonitorClient id={id} />
			</Suspense>
		</HydrateClient>
	);
}
