"use client";

import { Github, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import type { FooterLink } from "@/lib/get-site-settings";

interface PublicMobileMenuProps {
	headerNavigation: FooterLink[];
	githubUrl: string | null;
	isAuthenticated: boolean;
}

export function PublicMobileMenu({
	headerNavigation,
	githubUrl,
	isAuthenticated,
}: PublicMobileMenuProps) {
	const [open, setOpen] = useState(false);

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger asChild>
				<Button
					aria-label="Open menu"
					className="sm:hidden"
					size="icon"
					variant="ghost"
				>
					<Menu className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent className="w-72" side="right">
				<SheetHeader>
					<SheetTitle>Menu</SheetTitle>
				</SheetHeader>
				<nav className="mt-6 flex flex-col gap-1">
					{headerNavigation.map((link) => (
						<Link
							className="rounded-lg px-4 py-3 font-medium text-sm transition-colors hover:bg-neutral-900"
							href={link.href}
							key={link.href}
							onClick={() => setOpen(false)}
							{...(link.external && {
								target: "_blank",
								rel: "noopener noreferrer",
							})}
						>
							{link.label}
						</Link>
					))}
					{githubUrl && (
						<Link
							className="flex items-center gap-2 rounded-lg px-4 py-3 font-medium text-sm transition-colors hover:bg-neutral-900"
							href={githubUrl}
							onClick={() => setOpen(false)}
							rel="noopener noreferrer"
							target="_blank"
						>
							<Github className="size-4" />
							GitHub
						</Link>
					)}
					<div className="my-3 border-neutral-800 border-t" />
					{isAuthenticated ? (
						<Link
							className="rounded-lg bg-neutral-100 px-4 py-3 text-center font-medium text-neutral-900 text-sm transition-colors hover:bg-neutral-200"
							href="/dashboard"
							onClick={() => setOpen(false)}
						>
							Dashboard
						</Link>
					) : (
						<>
							<Link
								className="rounded-lg px-4 py-3 text-center font-medium text-sm transition-colors hover:bg-neutral-900"
								href="/auth/login"
								onClick={() => setOpen(false)}
							>
								Sign in
							</Link>
							<Link
								className="rounded-lg bg-neutral-100 px-4 py-3 text-center font-medium text-neutral-900 text-sm transition-colors hover:bg-neutral-200"
								href="/auth/register"
								onClick={() => setOpen(false)}
							>
								Get Started
							</Link>
						</>
					)}
				</nav>
			</SheetContent>
		</Sheet>
	);
}
