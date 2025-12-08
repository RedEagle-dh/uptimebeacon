"use client";

import { Eye, EyeOff, Loader2, Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

interface WebhookHeader {
	key: string;
	value: string;
}

interface WebhookHeadersFieldProps {
	headers: WebhookHeader[];
	onChange: (headers: WebhookHeader[]) => void;
	isEditMode?: boolean;
	channelId?: string;
}

export function WebhookHeadersField({
	headers,
	onChange,
	isEditMode = false,
	channelId,
}: WebhookHeadersFieldProps) {
	const [visibleValues, setVisibleValues] = useState<Record<number, boolean>>(
		{},
	);
	const [revealedValues, setRevealedValues] = useState<Record<number, string>>(
		{},
	);
	const [loadingIndices, setLoadingIndices] = useState<Record<number, boolean>>(
		{},
	);

	const utils = api.useUtils();

	const addHeader = () => {
		onChange([...headers, { key: "", value: "" }]);
	};

	const removeHeader = (index: number) => {
		const newHeaders = headers.filter((_, i) => i !== index);
		onChange(newHeaders);
		// Clean up visibility state
		setVisibleValues((prev) => {
			const next = { ...prev };
			delete next[index];
			return next;
		});
		setRevealedValues((prev) => {
			const next = { ...prev };
			delete next[index];
			return next;
		});
	};

	const updateHeader = (
		index: number,
		field: "key" | "value",
		value: string,
	) => {
		const newHeaders = [...headers];
		const currentHeader = newHeaders[index] ?? { key: "", value: "" };
		newHeaders[index] = { ...currentHeader, [field]: value };
		onChange(newHeaders);
		// If value was changed manually, clear revealed value
		if (field === "value") {
			setRevealedValues((prev) => {
				const next = { ...prev };
				delete next[index];
				return next;
			});
		}
	};

	const toggleValueVisibility = async (index: number, headerKey: string) => {
		const isCurrentlyVisible = visibleValues[index];

		if (
			!isCurrentlyVisible &&
			isEditMode &&
			channelId &&
			!revealedValues[index] &&
			headers[index]?.value.startsWith("****")
		) {
			// Need to fetch the decrypted value
			setLoadingIndices((prev) => ({ ...prev, [index]: true }));
			try {
				const data = await utils.notification.revealSecret.fetch({
					channelId,
					fieldName: `webhookHeader_${headerKey}`,
				});

				if (data?.value) {
					setRevealedValues((prev) => ({ ...prev, [index]: data.value }));
				}
			} catch {
				// Failed to reveal, keep hidden
			} finally {
				setLoadingIndices((prev) => ({ ...prev, [index]: false }));
			}
		}

		setVisibleValues((prev) => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	const getDisplayValue = (index: number): string => {
		if (visibleValues[index] && revealedValues[index]) {
			return revealedValues[index];
		}
		return headers[index]?.value || "";
	};

	return (
		<div className="space-y-3">
			<Label className="flex items-center gap-1">
				Custom Headers
				<Lock className="size-3 text-muted-foreground" />
			</Label>
			<p className="text-muted-foreground text-sm">Add custom HTTP headers</p>

			<div className="space-y-2">
				{headers.map((header, index) => (
					<div className="flex items-center gap-2" key={index}>
						<Input
							className="flex-1"
							onChange={(e) => updateHeader(index, "key", e.target.value)}
							placeholder="Header name"
							value={header.key}
						/>
						<div className="relative flex-1">
							<Input
								className="pr-10"
								onChange={(e) => updateHeader(index, "value", e.target.value)}
								placeholder={isEditMode ? "New value" : "Header value"}
								type={visibleValues[index] ? "text" : "password"}
								value={getDisplayValue(index)}
							/>
							<Button
								className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
								disabled={loadingIndices[index]}
								onClick={() => toggleValueVisibility(index, header.key)}
								size="sm"
								type="button"
								variant="ghost"
							>
								{loadingIndices[index] ? (
									<Loader2 className="size-4 animate-spin text-muted-foreground" />
								) : visibleValues[index] ? (
									<EyeOff className="size-4 text-muted-foreground" />
								) : (
									<Eye className="size-4 text-muted-foreground" />
								)}
							</Button>
						</div>
						<Button
							className="shrink-0"
							onClick={() => removeHeader(index)}
							size="icon"
							type="button"
							variant="ghost"
						>
							<Trash2 className="size-4 text-muted-foreground" />
						</Button>
					</div>
				))}
			</div>

			<Button
				className="w-full"
				onClick={addHeader}
				type="button"
				variant="outline"
			>
				<Plus className="mr-2 size-4" />
				Add Header
			</Button>
		</div>
	);
}
