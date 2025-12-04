import { HydrateClient } from "@/trpc/server";

import { NewMonitorClient } from "./_components/NewMonitorClient";

export default function NewMonitorPage() {
	return (
		<HydrateClient>
			<NewMonitorClient />
		</HydrateClient>
	);
}
