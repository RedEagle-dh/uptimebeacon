import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-neutral-600 focus-visible:ring-[3px] focus-visible:ring-neutral-700/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				// Default: Neutral gray badge
				default:
					"border-neutral-800 bg-neutral-900 text-neutral-300 [a&]:hover:bg-neutral-800",
				// Secondary: More subtle gray
				secondary:
					"border-transparent bg-neutral-900/50 text-neutral-400 [a&]:hover:bg-neutral-800/50",
				// Destructive: Semantic red - only color allowed
				destructive:
					"border-transparent bg-red-500/10 text-red-500 focus-visible:ring-red-500/20 [a&]:hover:bg-red-500/20",
				// Outline: Border only
				outline:
					"border-neutral-800 text-neutral-400 [a&]:hover:bg-neutral-900/50 [a&]:hover:text-neutral-300",
				// Success: Semantic green for status
				success:
					"border-transparent bg-green-500/10 text-green-500 [a&]:hover:bg-green-500/20",
				// Warning: Semantic yellow for status
				warning:
					"border-transparent bg-yellow-500/10 text-yellow-500 [a&]:hover:bg-yellow-500/20",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span";

	return (
		<Comp
			className={cn(badgeVariants({ variant }), className)}
			data-slot="badge"
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
