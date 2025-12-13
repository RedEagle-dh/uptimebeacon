"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";

interface AddMonitorDialogProps {
	statusPageId: string;
	existingMonitorIds: string[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddMonitorDialog({
	statusPageId,
	existingMonitorIds,
	open,
	onOpenChange,
}: AddMonitorDialogProps) {
	const utils = api.useUtils();

	const [monitorId, setMonitorId] = useState("");
	const [displayName, setDisplayName] = useState("");

	const { data: monitors, isLoading: monitorsLoading } =
		api.monitor.getAll.useQuery();

	const addMonitorMutation = api.statusPage.addMonitor.useMutation({
		onSuccess: () => {
			toast.success("Monitor added to status page");
			utils.statusPage.getById.invalidate({ id: statusPageId });
			resetForm();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to add monitor");
		},
	});

	const resetForm = () => {
		setMonitorId("");
		setDisplayName("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!monitorId) {
			toast.error("Please select a monitor");
			return;
		}

		addMonitorMutation.mutate({
			statusPageId,
			monitorId,
			displayName: displayName.trim() || undefined,
		});
	};

	// Filter out monitors that are already added to this status page
	const availableMonitors = monitors?.filter(
		(m) => !existingMonitorIds.includes(m.id),
	);

	const hasAvailableMonitors =
		availableMonitors && availableMonitors.length > 0;

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Monitor</DialogTitle>
					<DialogDescription>
						Select a monitor to display on this status page.
					</DialogDescription>
				</DialogHeader>

				{!hasAvailableMonitors && !monitorsLoading ? (
					<div className="py-6 text-center text-muted-foreground">
						<p className="mb-2">No monitors available to add.</p>
						<p className="text-sm">
							{monitors?.length === 0
								? "Create a monitor first to add it here."
								: "All your monitors are already added to this status page."}
						</p>
					</div>
				) : (
					<form onSubmit={handleSubmit}>
						<div className="space-y-4 py-4">
							<div className="space-y-2">
								<Label htmlFor="monitor">Monitor *</Label>
								<Select
									onValueChange={(value) => value && setMonitorId(value)}
									value={monitorId}
								>
									<SelectTrigger className="w-full" id="monitor">
										<SelectValue>
											{monitorsLoading
												? "Loading monitors..."
												: "Select a monitor"}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{availableMonitors?.map((monitor) => (
											<SelectItem key={monitor.id} value={monitor.id}>
												{monitor.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="displayName">Display Name (Optional)</Label>
								<Input
									id="displayName"
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder="Override the monitor name on this page"
									value={displayName}
								/>
								<p className="text-muted-foreground text-xs">
									Leave empty to use the original monitor name
								</p>
							</div>
						</div>

						<DialogFooter>
							<Button
								onClick={() => onOpenChange(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								disabled={addMonitorMutation.isPending || !hasAvailableMonitors}
								type="submit"
							>
								{addMonitorMutation.isPending ? "Adding..." : "Add Monitor"}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
