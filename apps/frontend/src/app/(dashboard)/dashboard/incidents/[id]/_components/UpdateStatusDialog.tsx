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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INCIDENT_STATUS_CONFIG } from "@/lib/constants";
import { api } from "@/trpc/react";

interface UpdateStatusDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	incidentId: string;
	currentStatus: string;
}

type IncidentStatus =
	| "investigating"
	| "identified"
	| "monitoring"
	| "resolved";

const STATUS_ORDER: IncidentStatus[] = [
	"investigating",
	"identified",
	"monitoring",
	"resolved",
];

function getNextStatus(current: string): IncidentStatus {
	const currentIndex = STATUS_ORDER.indexOf(current as IncidentStatus);
	if (currentIndex >= 0 && currentIndex < STATUS_ORDER.length - 1) {
		const nextStatus = STATUS_ORDER[currentIndex + 1];
		if (nextStatus) {
			return nextStatus;
		}
	}
	return current as IncidentStatus;
}

export function UpdateStatusDialog({
	open,
	onOpenChange,
	incidentId,
	currentStatus,
}: UpdateStatusDialogProps) {
	const utils = api.useUtils();

	const [status, setStatus] = useState<IncidentStatus>(
		getNextStatus(currentStatus),
	);
	const [message, setMessage] = useState("");

	const updateStatusMutation = api.incident.updateStatus.useMutation({
		onSuccess: () => {
			toast.success("Status updated");
			utils.incident.getById.invalidate({ id: incidentId });
			utils.incident.getAll.invalidate();
			resetForm();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update status");
		},
	});

	const resetForm = () => {
		setStatus(getNextStatus(currentStatus));
		setMessage("");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!message.trim()) {
			toast.error("Please enter an update message");
			return;
		}

		updateStatusMutation.mutate({
			id: incidentId,
			status,
			message: message.trim(),
		});
	};

	// Reset form when dialog opens with new status
	const handleOpenChange = (newOpen: boolean) => {
		if (newOpen) {
			setStatus(getNextStatus(currentStatus));
			setMessage("");
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Update Incident Status</DialogTitle>
					<DialogDescription>
						Change the incident status and provide an update message.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="status">New Status</Label>
							<Select
								onValueChange={(v) => setStatus(v as IncidentStatus)}
								value={status}
							>
								<SelectTrigger className="w-full" id="status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{STATUS_ORDER.map((s) => (
										<SelectItem key={s} value={s}>
											<div className="flex items-center gap-2">
												<span
													className={`size-2 rounded-full ${INCIDENT_STATUS_CONFIG[s].dotClass}`}
												/>
												{INCIDENT_STATUS_CONFIG[s].label}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="message">Update Message *</Label>
							<Textarea
								id="message"
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Describe what actions have been taken or what's changed..."
								rows={4}
								value={message}
							/>
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
						<Button disabled={updateStatusMutation.isPending} type="submit">
							{updateStatusMutation.isPending ? "Updating..." : "Update Status"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
