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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

interface AddUpdateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	incidentId: string;
}

export function AddUpdateDialog({
	open,
	onOpenChange,
	incidentId,
}: AddUpdateDialogProps) {
	const utils = api.useUtils();

	const [message, setMessage] = useState("");

	const addUpdateMutation = api.incident.addUpdate.useMutation({
		onSuccess: () => {
			toast.success("Update added");
			utils.incident.getById.invalidate({ id: incidentId });
			utils.incident.getAll.invalidate();
			setMessage("");
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to add update");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!message.trim()) {
			toast.error("Please enter an update message");
			return;
		}

		addUpdateMutation.mutate({
			incidentId,
			message: message.trim(),
		});
	};

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setMessage("");
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Add Update</DialogTitle>
					<DialogDescription>
						Add a new update to the incident timeline without changing the
						status.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="message">Update Message *</Label>
							<Textarea
								id="message"
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Provide an update on the current situation..."
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
						<Button disabled={addUpdateMutation.isPending} type="submit">
							{addUpdateMutation.isPending ? "Adding..." : "Add Update"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
