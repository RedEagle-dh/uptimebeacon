import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium text-sm outline-none transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				// Primary: Dark gray button with white text - NO color
				default:
					"border border-neutral-800 bg-neutral-900/80 text-white shadow-sm hover:bg-neutral-800 active:scale-[0.98]",
				// Destructive: Only semantic color allowed
				destructive:
					"bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/20 active:scale-[0.98]",
				// Outline: Subtle border with hover state
				outline:
					"border border-neutral-800 bg-transparent shadow-sm hover:bg-neutral-900/50 hover:text-neutral-100 active:scale-[0.98]",
				// Secondary: Muted gray
				secondary:
					"bg-neutral-900 text-neutral-300 shadow-sm hover:bg-neutral-800 hover:text-neutral-100 active:scale-[0.98]",
				// Ghost: No background, just hover state
				ghost:
					"hover:bg-neutral-900/50 hover:text-neutral-100 active:scale-[0.98]",
				// Link: Underline style, neutral color
				link: "text-neutral-300 underline-offset-4 hover:text-neutral-100 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5",
				lg: "h-11 rounded-lg px-6 text-base has-[>svg]:px-4",
				xl: "h-12 rounded-lg px-8 text-base has-[>svg]:px-5",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			data-slot="button"
			{...props}
		/>
	);
}

export { Button, buttonVariants };
