import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			className={cn(
				"field-sizing-content flex min-h-16 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-base text-neutral-100 shadow-xs outline-none transition-[color,box-shadow] placeholder:text-neutral-600 focus-visible:border-neutral-600 focus-visible:ring-[3px] focus-visible:ring-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-red-500/20 md:text-sm",
				className,
			)}
			data-slot="textarea"
			{...props}
		/>
	);
}

export { Textarea };
