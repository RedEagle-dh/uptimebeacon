"use client";

import { Command, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
	dashboard: "Dashboard",
	monitors: "Monitors",
	incidents: "Incidents",
	"status-pages": "Status Pages",
	notifications: "Notifications",
	settings: "Settings",
	new: "New",
	edit: "Edit",
};

export function DashboardHeader() {
	const pathname = usePathname();

	const segments = pathname.split("/").filter(Boolean);
	const breadcrumbs = segments.map((segment, index) => {
		const href = `/${segments.slice(0, index + 1).join("/")}`;
		const isLast = index === segments.length - 1;
		const label = ROUTE_LABELS[segment] ?? segment;

		return { href, label, isLast };
	});

	return (
		<header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-neutral-900 border-b bg-black/80 px-4 backdrop-blur-sm">
			<SidebarTrigger className="-ml-1 size-8 text-neutral-500 hover:text-neutral-300" />
			<Separator className="h-4 bg-neutral-800" orientation="vertical" />

			<Breadcrumb className="flex-1">
				<BreadcrumbList>
					{breadcrumbs.map((crumb, index) => (
						<Fragment key={crumb.href}>
							{index > 0 && (
								<BreadcrumbSeparator className="text-neutral-700" />
							)}
							<BreadcrumbItem>
								{crumb.isLast ? (
									<BreadcrumbPage className="font-medium text-neutral-100">
										{crumb.label}
									</BreadcrumbPage>
								) : (
									<BreadcrumbLink
										className="text-neutral-500 transition-colors duration-200 hover:text-neutral-300"
										href={crumb.href}
									>
										{crumb.label}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>

			{/* Search - keyboard shortcut hint */}
			<button
				className={cn(
					"hidden h-8 w-64 items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 text-neutral-500 text-sm transition-all duration-200 md:flex",
					"hover:border-neutral-700 hover:bg-neutral-900 hover:text-neutral-400",
				)}
				type="button"
			>
				<Search className="size-4" />
				<span className="flex-1 text-left">Search...</span>
				<kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border border-neutral-800 bg-neutral-950 px-1.5 font-medium font-mono text-[10px] text-neutral-600 sm:flex">
					<Command className="size-3" />K
				</kbd>
			</button>
		</header>
	);
}
