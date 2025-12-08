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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SEVERITY_CONFIG } from "@/lib/constants";
import { api } from "@/trpc/react";

interface CreateIncidentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type Severity = "minor" | "major" | "critical";

export function CreateIncidentDialog({
	open,
	onOpenChange,
}: CreateIncidentDialogProps) {
	const utils = api.useUtils();

	const [monitorId, setMonitorId] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [severity, setSeverity] = useState<Severity>("minor");

	const { data: monitors, isLoading: monitorsLoading } =
		api.monitor.getAll.useQuery();

	const createMutation = api.incident.create.useMutation({
		onSuccess: () => {
			toast.success("Incident reported successfully");
			utils.incident.getAll.invalidate();
			resetForm();
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to report incident");
		},
	});

	const resetForm = () => {
		setMonitorId("");
		setTitle("");
		setDescription("");
		setSeverity("minor");
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!monitorId) {
			toast.error("Please select a monitor");
			return;
		}

		if (!title.trim()) {
			toast.error("Please enter a title");
			return;
		}

		createMutation.mutate({
			monitorId,
			title: title.trim(),
			description: description.trim() || undefined,
			severity,
		});
	};

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Report Incident</DialogTitle>
					<DialogDescription>
						Create a new incident to track an ongoing issue with one of your
						monitors.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<ScrollArea className="h-[60vh]">
						<div className="space-y-4 py-4 pr-4">
							<div className="space-y-2">
								<Label htmlFor="monitor">Monitor *</Label>
								<Select onValueChange={setMonitorId} value={monitorId}>
									<SelectTrigger className="w-full" id="monitor">
										<SelectValue
											placeholder={
												monitorsLoading
													? "Loading monitors..."
													: "Select a monitor"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{monitors?.map((monitor) => (
											<SelectItem key={monitor.id} value={monitor.id}>
												{monitor.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="title">Title *</Label>
								<Input
									id="title"
									onChange={(e) => setTitle(e.target.value)}
									placeholder="e.g., API endpoints returning 500 errors"
									value={title}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="severity">Severity</Label>
								<Select
									onValueChange={(v) => setSeverity(v as Severity)}
									value={severity}
								>
									<SelectTrigger className="w-full" id="severity">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => (
											<SelectItem key={sev} value={sev}>
												<div className="flex items-center gap-2">
													<span
														className={`size-2 rounded-full ${SEVERITY_CONFIG[sev].dotClass}`}
													/>
													{SEVERITY_CONFIG[sev].label}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<Textarea
									className="max-h-[200px] resize-none overflow-auto [overflow-wrap:anywhere] [word-break:break-all]"
									id="description"
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Describe the incident and what you've observed..."
									rows={3}
									value={description}
								/>
							</div>
						</div>
					</ScrollArea>

					<DialogFooter>
						<Button
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Cancel
						</Button>
						<Button disabled={createMutation.isPending} type="submit">
							{createMutation.isPending ? "Reporting..." : "Report Incident"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
