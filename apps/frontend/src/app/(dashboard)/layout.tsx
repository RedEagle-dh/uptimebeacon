import { redirect } from "next/navigation";

import {
	DashboardContent,
	DashboardHeader,
	DashboardSidebar,
} from "@/components/layouts";
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

	const isAdmin = session.user.role === "ADMIN";

	return (
		<SidebarProvider>
			<DashboardSidebar user={session.user} />
			<SidebarInset>
				<DashboardHeader />
				<div className="flex flex-1 flex-col gap-6 p-6 pt-4 md:p-8 md:pt-6">
					<DashboardContent isAdmin={isAdmin}>{children}</DashboardContent>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
