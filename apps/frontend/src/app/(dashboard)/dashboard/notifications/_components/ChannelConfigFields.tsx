"use client";

import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	NOTIFICATION_CHANNEL_FIELDS,
	type NotificationChannelType,
} from "@/lib/constants";
import { api } from "@/trpc/react";

interface ChannelConfigFieldsProps {
	type: NotificationChannelType;
	config: Record<string, string>;
	onConfigChange: (fieldName: string, value: string) => void;
	isEditMode?: boolean;
	channelId?: string;
}

export function ChannelConfigFields({
	type,
	config,
	onConfigChange,
	isEditMode = false,
	channelId,
}: ChannelConfigFieldsProps) {
	const channelConfig = NOTIFICATION_CHANNEL_FIELDS[type];
	const [visiblePasswords, setVisiblePasswords] = useState<
		Record<string, boolean>
	>({});
	const [revealedSecrets, setRevealedSecrets] = useState<
		Record<string, string>
	>({});
	const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>(
		{},
	);

	const utils = api.useUtils();

	const togglePasswordVisibility = async (fieldName: string) => {
		const isCurrentlyVisible = visiblePasswords[fieldName];

		if (
			!isCurrentlyVisible &&
			isEditMode &&
			channelId &&
			!revealedSecrets[fieldName]
		) {
			// Need to fetch the decrypted value
			setLoadingFields((prev) => ({ ...prev, [fieldName]: true }));
			try {
				const data = await utils.notification.revealSecret.fetch({
					channelId,
					fieldName,
				});

				if (data?.value) {
					setRevealedSecrets((prev) => ({ ...prev, [fieldName]: data.value }));
				}
			} catch {
				// Failed to reveal, keep hidden
			} finally {
				setLoadingFields((prev) => ({ ...prev, [fieldName]: false }));
			}
		}

		setVisiblePasswords((prev) => ({
			...prev,
			[fieldName]: !prev[fieldName],
		}));
	};

	const getDisplayValue = (fieldName: string): string => {
		if (visiblePasswords[fieldName] && revealedSecrets[fieldName]) {
			return revealedSecrets[fieldName];
		}
		const value = config[fieldName] || "";
		// Debug: log what value is being displayed
		console.log(
			`[getDisplayValue] ${fieldName}:`,
			value.substring(0, 20) + (value.length > 20 ? "..." : ""),
		);
		return value;
	};

	return (
		<>
			{channelConfig.fields.map((field) => (
				<div className="space-y-2" key={field.name}>
					<Label htmlFor={field.name}>
						{field.label}
						{field.required && " *"}
						{field.type === "password" && (
							<Lock className="ml-1 inline-block size-3 text-muted-foreground" />
						)}
					</Label>
					{field.type === "textarea" ? (
						<Textarea
							id={field.name}
							onChange={(e) => onConfigChange(field.name, e.target.value)}
							placeholder={field.placeholder}
							rows={3}
							value={config[field.name] || ""}
						/>
					) : field.type === "password" ? (
						<div className="relative">
							<Input
								className="pr-10"
								id={field.name}
								onChange={(e) => onConfigChange(field.name, e.target.value)}
								placeholder={
									isEditMode ? "Enter new value to update" : field.placeholder
								}
								type={visiblePasswords[field.name] ? "text" : "password"}
								value={getDisplayValue(field.name)}
							/>
							<Button
								className="absolute top-0 right-0 h-full px-3 hover:bg-transparent"
								disabled={loadingFields[field.name]}
								onClick={() => togglePasswordVisibility(field.name)}
								size="sm"
								type="button"
								variant="ghost"
							>
								{loadingFields[field.name] ? (
									<Loader2 className="size-4 animate-spin text-muted-foreground" />
								) : visiblePasswords[field.name] ? (
									<EyeOff className="size-4 text-muted-foreground" />
								) : (
									<Eye className="size-4 text-muted-foreground" />
								)}
							</Button>
						</div>
					) : (
						<Input
							id={field.name}
							onChange={(e) => onConfigChange(field.name, e.target.value)}
							placeholder={field.placeholder}
							type={field.type === "url" ? "url" : field.type}
							value={config[field.name] || ""}
						/>
					)}
					{field.description && (
						<p className="text-muted-foreground text-sm">{field.description}</p>
					)}
				</div>
			))}
		</>
	);
}
