import { db } from "@uptimebeacon/database";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getSiteSettings } from "@/lib/get-site-settings";

import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: `Setup | ${settings.siteName}`,
		description: `Create your ${settings.siteName} admin account`,
	};
}

export default async function RegisterPage() {
	// Check if any users exist - if so, redirect to login
	const userCount = await db.user.count();
	if (userCount > 0) {
		redirect("/auth/login");
	}

	const settings = await getSiteSettings();

	return (
		<div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-6 sm:px-4 sm:py-12">
			{/* Background gradient */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2">
					<div className="h-[300px] w-[400px] rounded-full bg-primary/5 blur-3xl sm:h-[500px] sm:w-[800px]" />
				</div>
			</div>

			<Card className="relative w-full max-w-[440px] gap-4 border-border/50 py-4 shadow-xl sm:gap-6 sm:py-6">
				<CardHeader className="space-y-1 px-4 pb-0 text-center sm:px-6">
					<CardTitle className="font-bold text-xl sm:text-2xl">
						Welcome to {settings.siteName}
					</CardTitle>
					<CardDescription className="text-sm">
						Create your admin account to get started
					</CardDescription>
				</CardHeader>
				<CardContent className="px-4 pb-2 sm:px-6 sm:pb-4">
					<RegisterForm />
				</CardContent>
			</Card>
		</div>
	);
}
