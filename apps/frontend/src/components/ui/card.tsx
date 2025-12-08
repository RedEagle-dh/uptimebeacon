import type * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex flex-col gap-6 rounded-xl border border-neutral-800 bg-neutral-950 py-6 text-neutral-100 shadow-black/20 shadow-lg",
				"transition-all duration-200 ease-out",
				"hover:border-neutral-700",
				className,
			)}
			data-slot="card"
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] sm:px-6 [.border-b]:pb-6",
				className,
			)}
			data-slot="card-header"
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("font-semibold leading-none tracking-tight", className)}
			data-slot="card-title"
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("text-muted-foreground text-sm", className)}
			data-slot="card-description"
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"col-start-2 row-span-2 row-start-1 self-start justify-self-end",
				className,
			)}
			data-slot="card-action"
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn("px-4 sm:px-6", className)}
			data-slot="card-content"
			{...props}
		/>
	);
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"flex items-center px-4 sm:px-6 [.border-t]:pt-6",
				className,
			)}
			data-slot="card-footer"
			{...props}
		/>
	);
}

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardAction,
	CardDescription,
	CardContent,
};
