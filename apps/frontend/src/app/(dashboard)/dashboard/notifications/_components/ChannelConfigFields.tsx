"use client";

import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	NOTIFICATION_CHANNEL_FIELDS,
	type NotificationChannelType,
} from "@/lib/constants";
import { api } from "@/trpc/react";

import { WebhookHeadersField } from "./WebhookHeadersField";

interface ChannelConfigFieldsProps {
	type: NotificationChannelType;
	config: Record<string, string>;
	onConfigChange: (fieldName: string, value: string) => void;
	isEditMode?: boolean;
	channelId?: string;
}

interface WebhookHeader {
	key: string;
	value: string;
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

	// Local state for webhook headers (allows empty keys while editing)
	const [webhookHeaders, setWebhookHeaders] = useState<WebhookHeader[]>([]);

	// Initialize headers from config on mount (only once)
	const initializedRef = useRef(false);
	useEffect(() => {
		if (type !== "WEBHOOK" || initializedRef.current) return;
		initializedRef.current = true;

		const headers: WebhookHeader[] = [];
		for (const [key, value] of Object.entries(config)) {
			// Only include non-empty keys with non-empty values
			if (key.startsWith("webhookHeader_") && value) {
				const headerKey = key.replace("webhookHeader_", "");
				headers.push({ key: headerKey, value });
			}
		}
		if (headers.length > 0) {
			setWebhookHeaders(headers);
		}
	}, [type, config]);

	// Reset initialization when type changes
	useEffect(() => {
		if (type !== "WEBHOOK") {
			initializedRef.current = false;
			setWebhookHeaders([]);
		}
	}, [type]);

	const handleWebhookHeadersChange = (headers: WebhookHeader[]) => {
		// Update local state immediately (allows empty keys)
		setWebhookHeaders(headers);

		// Build the set of keys we want to keep
		const newKeys = new Set(
			headers.filter((h) => h.key).map((h) => `webhookHeader_${h.key}`),
		);

		// Remove old keys that are no longer needed
		for (const key of Object.keys(config)) {
			if (key.startsWith("webhookHeader_") && !newKeys.has(key)) {
				onConfigChange(key, "");
			}
		}

		// Add/update headers with non-empty keys
		for (const header of headers) {
			if (header.key) {
				onConfigChange(`webhookHeader_${header.key}`, header.value);
			}
		}
	};

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
					{field.type === "password" ? (
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

			{type === "WEBHOOK" && (
				<WebhookHeadersField
					channelId={channelId}
					headers={webhookHeaders}
					isEditMode={isEditMode}
					onChange={handleWebhookHeadersChange}
				/>
			)}
		</>
	);
}
