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

import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSiteSettings();
	return {
		title: `Login | ${settings.siteName}`,
		description: `Sign in to your ${settings.siteName} account`,
	};
}

export default async function LoginPage() {
	// If no users exist, redirect to registration
	const userCount = await db.user.count();
	if (userCount === 0) {
		redirect("/auth/register");
	}

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
					<CardTitle className="font-bold text-2xl">Welcome back</CardTitle>
					<CardDescription>Sign in to your account to continue</CardDescription>
				</CardHeader>
				<CardContent className="pb-4">
					<LoginForm />
				</CardContent>
			</Card>
		</div>
	);
}
