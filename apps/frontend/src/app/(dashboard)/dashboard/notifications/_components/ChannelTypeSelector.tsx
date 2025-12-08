"use client";

import { Label } from "@/components/ui/label";
import {
	CHANNEL_COLORS,
	NOTIFICATION_CHANNEL_FIELDS,
	NOTIFICATION_CHANNEL_TYPES,
	type NotificationChannelType,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

import { CHANNEL_ICONS } from "./ChannelIcons";

interface ChannelTypeSelectorProps {
	value: NotificationChannelType;
	onChange: (type: NotificationChannelType) => void;
}

export function ChannelTypeSelector({
	value,
	onChange,
}: ChannelTypeSelectorProps) {
	return (
		<div className="space-y-3">
			<Label>Channel Type</Label>
			<div className="flex gap-2">
				{NOTIFICATION_CHANNEL_TYPES.map((channelType) => {
					const Icon = CHANNEL_ICONS[channelType];
					const colors = CHANNEL_COLORS[channelType];
					const config = NOTIFICATION_CHANNEL_FIELDS[channelType];
					const isSelected = value === channelType;

					return (
						<button
							className={cn(
								"flex flex-1 flex-col items-center gap-1.5 rounded-lg border-2 py-3 transition-all hover:bg-muted/50",
								isSelected
									? `border-primary ${colors.bgClass}`
									: "border-transparent bg-muted/30",
							)}
							key={channelType}
							onClick={() => onChange(channelType)}
							type="button"
						>
							<div
								className={cn(
									"flex size-10 items-center justify-center rounded-lg",
									isSelected ? colors.bgClass : "bg-muted",
								)}
							>
								<Icon
									className={cn(
										"size-5",
										isSelected ? colors.textClass : "text-muted-foreground",
									)}
								/>
							</div>
							<span
								className={cn(
									"font-medium text-xs",
									isSelected ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{config.label}
							</span>
						</button>
					);
				})}
			</div>
			<p className="text-muted-foreground text-sm">
				{NOTIFICATION_CHANNEL_FIELDS[value].description}
			</p>
		</div>
	);
}
