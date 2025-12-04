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
		<div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
			{/* Background gradient */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="-translate-x-1/2 -translate-y-1/2 absolute top-0 left-1/2">
					<div className="h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
				</div>
			</div>

			<Card className="relative w-[440px] max-w-full border-border/50 shadow-xl">
				<CardHeader className="space-y-1 pb-4 text-center">
					<CardTitle className="font-bold text-2xl">
						Welcome to {settings.siteName}
					</CardTitle>
					<CardDescription>
						Create your admin account to get started
					</CardDescription>
				</CardHeader>
				<CardContent className="pb-6">
					<RegisterForm />
				</CardContent>
			</Card>
		</div>
	);
}
