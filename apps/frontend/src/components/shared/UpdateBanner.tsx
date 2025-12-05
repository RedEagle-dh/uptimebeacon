"use client";

import { ArrowUpCircle, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

interface UpdateBannerProps {
	isAdmin: boolean;
	onViewDetails?: () => void;
}

export function UpdateBanner({ isAdmin, onViewDetails }: UpdateBannerProps) {
	const [isDismissed, setIsDismissed] = useState(false);

	const { data: status, isLoading } = api.update.getStatus.useQuery(undefined, {
		refetchInterval: 1000 * 60 * 30, // Refetch every 30 minutes
		staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
	});

	const dismissMutation = api.update.dismissUpdate.useMutation({
		onSuccess: () => {
			setIsDismissed(true);
		},
	});

	// Don't show if not admin, loading, no update, or dismissed
	if (!isAdmin || isLoading || !status?.updateAvailable) {
		return null;
	}

	// Check if this version was already dismissed
	if (status.dismissedVersion === status.latestVersion || isDismissed) {
		return null;
	}

	const handleDismiss = () => {
		if (status.latestVersion) {
			dismissMutation.mutate({ version: status.latestVersion });
		}
	};

	const getUpdateTypeLabel = () => {
		switch (status.updateType) {
			case "major":
				return "Major update";
			case "minor":
				return "New features";
			case "patch":
				return "Bug fixes";
			default:
				return "Update";
		}
	};

	return (
		<Alert className="mb-4" variant="warning">
			<ArrowUpCircle className="h-4 w-4" />
			<AlertTitle className="flex items-center justify-between">
				<span>
					{getUpdateTypeLabel()} available: {status.currentVersion} →{" "}
					{status.latestVersion}
				</span>
				<Button
					className="-mr-2 h-6 w-6"
					disabled={dismissMutation.isPending}
					onClick={handleDismiss}
					size="icon"
					variant="ghost"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Dismiss</span>
				</Button>
			</AlertTitle>
			<AlertDescription className="mt-1 flex items-center gap-2">
				<span>A new version of UptimeBeacon is available.</span>
				{status.releaseUrl && (
					<a
						className="underline hover:no-underline"
						href={status.releaseUrl}
						rel="noopener noreferrer"
						target="_blank"
					>
						Release notes
					</a>
				)}
				{onViewDetails && (
					<Button
						className="h-auto p-0 text-yellow-400"
						onClick={onViewDetails}
						size="sm"
						variant="link"
					>
						How to update
					</Button>
				)}
			</AlertDescription>
		</Alert>
	);
}
