import { redirect } from "next/navigation";

import { DashboardHeader, DashboardSidebar } from "@/components/layouts";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/server/auth";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/auth/login");
	}

	return (
		<SidebarProvider>
			<DashboardSidebar user={session.user} />
			<SidebarInset>
				<DashboardHeader />
				<div className="flex flex-1 flex-col gap-6 p-6 pt-4 md:p-8 md:pt-6">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
