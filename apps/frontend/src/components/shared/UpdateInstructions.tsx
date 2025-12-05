"use client";

import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface UpdateInstructionsProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentVersion: string;
	latestVersion: string | null;
	releaseUrl: string | null;
}

export function UpdateInstructions({
	open,
	onOpenChange,
	currentVersion,
	latestVersion,
	releaseUrl,
}: UpdateInstructionsProps) {
	const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

	const copyToClipboard = async (text: string, id: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedCommand(id);
			setTimeout(() => setCopiedCommand(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const updateCommands = `cd /path/to/uptimebeacon
docker compose pull
docker compose up -d`;

	const backupCommand = `docker compose exec db pg_dump -U postgres uptimebeacon > backup_$(date +%Y%m%d).sql`;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>How to Update UptimeBeacon</DialogTitle>
					<DialogDescription>
						Update from {currentVersion} to {latestVersion || "latest"}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Warning */}
					<div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
						<AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
						<div className="text-sm">
							<p className="font-medium text-yellow-500">Before updating</p>
							<p className="mt-1 text-yellow-400/80">
								Always back up your database before performing an update,
								especially for major version changes.
							</p>
						</div>
					</div>

					{/* Step 1: Backup */}
					<div className="space-y-2">
						<h3 className="font-medium text-neutral-200">
							Step 1: Backup your database (recommended)
						</h3>
						<div className="relative">
							<pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-neutral-300 text-sm">
								<code>{backupCommand}</code>
							</pre>
							<Button
								className="absolute top-2 right-2 h-8 w-8"
								onClick={() => copyToClipboard(backupCommand, "backup")}
								size="icon"
								variant="ghost"
							>
								{copiedCommand === "backup" ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					{/* Step 2: Update */}
					<div className="space-y-2">
						<h3 className="font-medium text-neutral-200">
							Step 2: Pull and restart containers
						</h3>
						<div className="relative">
							<pre className="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-neutral-300 text-sm">
								<code>{updateCommands}</code>
							</pre>
							<Button
								className="absolute top-2 right-2 h-8 w-8"
								onClick={() => copyToClipboard(updateCommands, "update")}
								size="icon"
								variant="ghost"
							>
								{copiedCommand === "update" ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>

					{/* Release Notes Link */}
					{releaseUrl && (
						<div className="pt-2">
							<a
								className="inline-flex items-center gap-2 text-blue-400 text-sm hover:text-blue-300"
								href={releaseUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								<ExternalLink className="h-4 w-4" />
								View release notes on GitHub
							</a>
						</div>
					)}

					{/* Watchtower Recommendation */}
					<div className="rounded-lg border border-neutral-800 p-4">
						<h3 className="mb-2 font-medium text-neutral-200">
							Automatic Updates with Watchtower
						</h3>
						<p className="mb-3 text-neutral-400 text-sm">
							For automatic updates, you can use{" "}
							<a
								className="text-blue-400 hover:underline"
								href="https://containrrr.dev/watchtower/"
								rel="noopener noreferrer"
								target="_blank"
							>
								Watchtower
							</a>
							, a container that monitors your running containers and
							automatically updates them when new images are available.
						</p>
						<p className="text-neutral-500 text-xs">
							Note: Watchtower requires access to the Docker socket, which has
							security implications. Only use it in trusted environments.
						</p>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
