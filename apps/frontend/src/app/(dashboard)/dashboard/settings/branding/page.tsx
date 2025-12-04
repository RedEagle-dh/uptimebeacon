import { Suspense } from "react";

import { BrandingPageSkeleton } from "@/components/shared";
import { api, HydrateClient } from "@/trpc/server";

import { BrandingClient } from "./_components/BrandingClient";

export default async function BrandingSettingsPage() {
	void api.siteSettings.get.prefetch();
	void api.siteSettings.getAvailableIcons.prefetch();

	return (
		<HydrateClient>
			<Suspense fallback={<BrandingPageSkeleton />}>
				<BrandingClient />
			</Suspense>
		</HydrateClient>
	);
}
