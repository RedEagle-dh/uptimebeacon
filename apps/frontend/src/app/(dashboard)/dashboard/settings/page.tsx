import { ArrowRight, Palette } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { auth } from "@/server/auth";
import { UpdateSettings } from "./_components/UpdateSettings";

export default async function SettingsPage() {
	const session = await auth();
	const isAdmin = session?.user?.role === "ADMIN";

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-2xl tracking-tight">Settings</h1>
				<p className="text-muted-foreground">
					Manage your account and preferences
				</p>
			</div>

			{/* Admin Settings */}
			{isAdmin && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Administration</CardTitle>
							<CardDescription>Site-wide settings (Admin only)</CardDescription>
						</CardHeader>
						<CardContent>
							<Link
								className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-border hover:bg-card"
								href="/dashboard/settings/branding"
							>
								<div className="flex items-center gap-4">
									<div className="flex size-10 items-center justify-center rounded-lg bg-muted">
										<Palette className="size-5 text-muted-foreground" />
									</div>
									<div>
										<p className="font-medium transition-colors group-hover:text-foreground">
											Branding & Customization
										</p>
										<p className="text-muted-foreground text-sm">
											Customize site name, icon, footer links, and more
										</p>
									</div>
								</div>
								<ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
							</Link>
						</CardContent>
					</Card>

					<UpdateSettings />
				</>
			)}

			{/* Profile Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Your personal information</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								defaultValue={session?.user?.name ?? ""}
								id="name"
								placeholder="Your name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								defaultValue={session?.user?.email ?? ""}
								disabled
								id="email"
								type="email"
							/>
						</div>
					</div>
					<Button>Save Changes</Button>
				</CardContent>
			</Card>

			{/* Security Settings */}
			<Card>
				<CardHeader>
					<CardTitle>Security</CardTitle>
					<CardDescription>Manage your security settings</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="current-password">Current Password</Label>
						<Input id="current-password" type="password" />
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="new-password">New Password</Label>
							<Input id="new-password" type="password" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm New Password</Label>
							<Input id="confirm-password" type="password" />
						</div>
					</div>
					<Button>Update Password</Button>
				</CardContent>
			</Card>

			{/* Preferences */}
			<Card>
				<CardHeader>
					<CardTitle>Preferences</CardTitle>
					<CardDescription>Customize your experience</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Email Notifications</p>
							<p className="text-muted-foreground text-sm">
								Receive email notifications for important events
							</p>
						</div>
						<Switch defaultChecked />
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Weekly Summary</p>
							<p className="text-muted-foreground text-sm">
								Receive a weekly summary of your monitors
							</p>
						</div>
						<Switch />
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">Dark Mode</p>
							<p className="text-muted-foreground text-sm">
								Use dark theme across the dashboard
							</p>
						</div>
						<Switch defaultChecked />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
