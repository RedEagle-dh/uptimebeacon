import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			className={cn(
				"h-9 w-full min-w-0 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1 text-base text-neutral-100 shadow-xs outline-none transition-[color,box-shadow] selection:bg-neutral-700 selection:text-neutral-100 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-neutral-300 file:text-sm placeholder:text-neutral-600 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
				"focus-visible:border-neutral-600 focus-visible:ring-[3px] focus-visible:ring-neutral-800",
				"aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
				className,
			)}
			data-slot="input"
			type={type}
			{...props}
		/>
	);
}

export { Input };
