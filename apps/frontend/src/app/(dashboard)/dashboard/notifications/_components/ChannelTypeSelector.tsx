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

const DISABLED_CHANNELS: NotificationChannelType[] = ["EMAIL", "WEBHOOK"];

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
			<div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
				{NOTIFICATION_CHANNEL_TYPES.map((channelType) => {
					const Icon = CHANNEL_ICONS[channelType];
					const colors = CHANNEL_COLORS[channelType];
					const config = NOTIFICATION_CHANNEL_FIELDS[channelType];
					const isSelected = value === channelType;
					const isDisabled = DISABLED_CHANNELS.includes(channelType);

					return (
						<button
							className={cn(
								"relative flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 transition-all",
								isDisabled
									? "cursor-not-allowed opacity-50"
									: "hover:bg-muted/50",
								isSelected && !isDisabled
									? `border-primary ${colors.bgClass}`
									: "border-transparent bg-muted/30",
							)}
							disabled={isDisabled}
							key={channelType}
							onClick={() => !isDisabled && onChange(channelType)}
							type="button"
						>
							{isDisabled && (
								<span className="-top-1.5 -right-1.5 absolute rounded-full bg-muted px-1.5 py-0.5 font-medium text-[8px] text-muted-foreground">
									Soon
								</span>
							)}
							<div
								className={cn(
									"flex size-8 items-center justify-center rounded-lg sm:size-10",
									isSelected && !isDisabled ? colors.bgClass : "bg-muted",
								)}
							>
								<Icon
									className={cn(
										"size-4 sm:size-5",
										isSelected && !isDisabled
											? colors.textClass
											: "text-muted-foreground",
									)}
								/>
							</div>
							<span
								className={cn(
									"font-medium text-[10px] sm:text-xs",
									isSelected && !isDisabled
										? "text-foreground"
										: "text-muted-foreground",
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
