"use client";

import { ExternalLink, Globe, Plus } from "lucide-react";
import Link from "next/link";

import { type Status, StatusDot } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type RouterOutputs } from "@/trpc/react";

type StatusPage = RouterOutputs["statusPage"]["getAll"][number];

function StatusPageCard({ page }: { page: StatusPage }) {
	const domain = page.customDomain;
	const monitorsCount = page._count.monitors;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="flex items-center gap-2 font-medium text-base">
					<Globe className="size-4" />
					{page.name}
				</CardTitle>
				<StatusDot status={page.overallStatus as Status} />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Badge variant={page.isPublic ? "default" : "secondary"}>
							{page.isPublic ? "Public" : "Private"}
						</Badge>
						<span className="text-muted-foreground text-sm">
							{monitorsCount} monitor{monitorsCount !== 1 ? "s" : ""}
						</span>
					</div>

					<div className="text-muted-foreground text-sm">
						{domain ? (
							<span className="flex items-center gap-1">
								<ExternalLink className="size-3" />
								{domain}
							</span>
						) : (
							<span>/{page.slug}</span>
						)}
					</div>

					<div className="flex gap-2 pt-2">
						<Button asChild className="flex-1" size="sm" variant="outline">
							<Link href={`/dashboard/status-pages/${page.id}`}>Edit</Link>
						</Button>
						<Button asChild size="sm" variant="ghost">
							<Link
								href={domain ? `https://${domain}` : `/${page.slug}`}
								rel="noopener noreferrer"
								target="_blank"
							>
								<ExternalLink className="size-4" />
							</Link>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export function StatusPagesClient() {
	const [statusPages] = api.statusPage.getAll.useSuspenseQuery();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Status Pages</h1>
					<p className="text-muted-foreground">
						Manage public status pages for your services
					</p>
				</div>
				<Button>
					<Plus className="mr-2 size-4" />
					Create Status Page
				</Button>
			</div>

			{statusPages.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<Globe className="mb-4 size-12 text-muted-foreground" />
						<p className="mb-4 font-medium">No status pages yet</p>
						<p className="mb-4 text-center text-muted-foreground text-sm">
							Create a public status page to keep your users informed
						</p>
						<Button>
							<Plus className="mr-2 size-4" />
							Create your first status page
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{statusPages.map((page) => (
						<StatusPageCard key={page.id} page={page} />
					))}
				</div>
			)}
		</div>
	);
}
