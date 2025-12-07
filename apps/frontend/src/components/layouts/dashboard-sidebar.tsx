"use client";

import {
	Activity,
	BarChart,
	Bell,
	CheckCircle,
	ChevronsUpDown,
	Cloud,
	Database,
	Eye,
	Gauge,
	Globe,
	LogOut,
	type LucideIcon,
	Monitor,
	Radar,
	Radio,
	Satellite,
	Server,
	Shield,
	Signal,
	TrendingUp,
	User,
	Wifi,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
	Activity,
	Zap,
	Shield,
	Globe,
	Server,
	Database,
	Cloud,
	Monitor,
	Radio,
	Wifi,
	Signal,
	BarChart,
	TrendingUp,
	CheckCircle,
	Bell,
	Eye,
	Gauge,
	Radar,
	Satellite,
};

interface DashboardSidebarProps {
	user?: {
		name?: string | null;
		email?: string | null;
		image?: string | null;
	};
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
	const pathname = usePathname();
	const { state } = useSidebar();
	const isCollapsed = state === "collapsed";

	// Fetch site settings
	const { data: settings } = api.siteSettings.get.useQuery(undefined, {
		staleTime: 1000 * 60 * 5, // Cache for 5 minutes
	});

	const siteName = settings?.siteName || "UptimeBeacon";
	const tagline = settings?.tagline || "Monitoring";
	const iconName = settings?.iconName || "Activity";
	const Icon = ICON_MAP[iconName] || Activity;

	return (
		<Sidebar
			className="border-neutral-900 border-r"
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="border-neutral-900 border-b">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="group"
							size="lg"
							tooltip={siteName}
						>
							<Link href="/dashboard">
								<div className="flex size-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-100 shadow-sm transition-transform duration-200 group-hover:scale-105">
									<Icon className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
									<span className="font-semibold text-neutral-100 tracking-tight">
										{siteName}
									</span>
									<span className="text-neutral-500 text-xs">{tagline}</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent className="px-2 py-4">
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							{NAVIGATION_ITEMS.map((item) => {
								const isActive =
									pathname === item.href ||
									(item.href !== "/dashboard" &&
										pathname.startsWith(item.href));

								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											asChild
											className={cn(
												"relative h-9 transition-all duration-200",
												isActive && [
													"bg-neutral-900 text-neutral-100",
													"before:-translate-y-1/2 before:absolute before:top-1/2 before:left-0 before:h-5 before:w-1 before:rounded-full before:bg-neutral-600",
												],
												!isActive && "hover:bg-neutral-900/50",
											)}
											isActive={isActive}
											tooltip={item.title}
										>
											<Link href={item.href}>
												<item.icon
													className={cn(
														"size-4 transition-colors duration-200",
														isActive ? "text-neutral-300" : "text-neutral-500",
													)}
												/>
												<span
													className={cn(
														"transition-colors duration-200",
														isActive
															? "font-medium text-neutral-100"
															: "text-neutral-400",
													)}
												>
													{item.title}
												</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-neutral-900 border-t p-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									className="h-auto p-2 hover:bg-neutral-900/50 data-[state=open]:bg-neutral-900"
									size="lg"
								>
									<Avatar className="size-8 rounded-lg ring-2 ring-neutral-800">
										<AvatarImage
											alt={user?.name ?? "User"}
											src={user?.image ?? undefined}
										/>
										<AvatarFallback className="rounded-lg bg-neutral-900 font-medium text-neutral-300 text-sm">
											{user?.name?.charAt(0)?.toUpperCase() ?? "U"}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight">
										<span className="truncate font-medium text-neutral-200">
											{user?.name ?? "User"}
										</span>
										<span className="truncate text-neutral-500 text-xs">
											{user?.email ?? ""}
										</span>
									</div>
									<ChevronsUpDown className="ml-auto size-4 text-neutral-600" />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align="end"
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl border-neutral-800 bg-neutral-950 p-1"
								side={isCollapsed ? "right" : "top"}
								sideOffset={8}
							>
								<DropdownMenuLabel className="p-0 font-normal">
									<div className="flex items-center gap-3 px-2 py-2">
										<Avatar className="size-10 rounded-lg ring-2 ring-neutral-800">
											<AvatarImage
												alt={user?.name ?? "User"}
												src={user?.image ?? undefined}
											/>
											<AvatarFallback className="rounded-lg bg-neutral-900 font-medium text-neutral-300 text-sm">
												{user?.name?.charAt(0)?.toUpperCase() ?? "U"}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left leading-tight">
											<span className="font-medium text-neutral-200">
												{user?.name ?? "User"}
											</span>
											<span className="text-neutral-500 text-xs">
												{user?.email ?? ""}
											</span>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator className="my-1 bg-neutral-800" />
								<DropdownMenuItem
									asChild
									className="cursor-pointer rounded-lg px-2 py-2 text-neutral-300 focus:bg-neutral-900 focus:text-neutral-100"
								>
									<Link href="/dashboard/settings">
										<User className="mr-2 size-4 text-neutral-500" />
										Account Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator className="my-1 bg-neutral-800" />
								<DropdownMenuItem
									className="cursor-pointer rounded-lg px-2 py-2 text-red-500 focus:bg-red-500/10 focus:text-red-400"
									onClick={() => signOut({ callbackUrl: "/" })}
								>
									<LogOut className="mr-2 size-4" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
