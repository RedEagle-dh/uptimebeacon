import { Suspense } from "react";

import { NotificationsPageSkeleton } from "@/components/shared";
import { api, HydrateClient } from "@/trpc/server";

import { NotificationsClient } from "./_components/NotificationsClient";

export default async function NotificationsPage() {
	void api.notification.getAll.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<NotificationsPageSkeleton />}>
				<NotificationsClient />
			</Suspense>
		</HydrateClient>
	);
}
