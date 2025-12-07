import { Suspense } from "react";

import { PublicStatusPageSkeleton } from "@/components/shared/skeletons";
import { api, HydrateClient } from "@/trpc/server";

import { PublicStatusBySlugClient } from "./_components/PublicStatusBySlugClient";

export default async function PublicStatusBySlugPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	void api.statusPage.getBySlug.prefetch({ slug });

	return (
		<HydrateClient>
			<Suspense fallback={<PublicStatusPageSkeleton />}>
				<PublicStatusBySlugClient slug={slug} />
			</Suspense>
		</HydrateClient>
	);
}
