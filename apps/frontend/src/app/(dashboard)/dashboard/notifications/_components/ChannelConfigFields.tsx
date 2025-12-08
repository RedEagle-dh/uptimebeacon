"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	NOTIFICATION_CHANNEL_FIELDS,
	type NotificationChannelType,
} from "@/lib/constants";

interface ChannelConfigFieldsProps {
	type: NotificationChannelType;
	config: Record<string, string>;
	onConfigChange: (fieldName: string, value: string) => void;
}

export function ChannelConfigFields({
	type,
	config,
	onConfigChange,
}: ChannelConfigFieldsProps) {
	const channelConfig = NOTIFICATION_CHANNEL_FIELDS[type];

	return (
		<>
			{channelConfig.fields.map((field) => (
				<div className="space-y-2" key={field.name}>
					<Label htmlFor={field.name}>
						{field.label}
						{field.required && " *"}
					</Label>
					{field.type === "textarea" ? (
						<Textarea
							id={field.name}
							onChange={(e) => onConfigChange(field.name, e.target.value)}
							placeholder={field.placeholder}
							rows={3}
							value={config[field.name] || ""}
						/>
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
