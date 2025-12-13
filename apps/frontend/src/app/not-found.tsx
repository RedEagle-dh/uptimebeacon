import { Home } from "lucide-react";
import Link from "next/link";

import { PublicHeader } from "@/components/layouts/public-header";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
	return (
		<div className="flex min-h-screen flex-col">
			<PublicHeader />

			<main className="flex flex-1 items-center justify-center">
				<div className="flex flex-col items-center justify-center py-12">
					<p className="font-bold text-8xl text-muted-foreground/50 tracking-tighter">
						404
					</p>
					<p className="mt-4 font-medium text-xl">Page not found</p>
					<p className="mt-1 text-center text-muted-foreground text-sm">
						The page you're looking for doesn't exist or has been moved.
					</p>
					<Button
						className="mt-6"
						nativeButton={false}
						render={<Link href="/" />}
					>
						<Home className="mr-2 size-4" />
						Back to Home
					</Button>
				</div>
			</main>
		</div>
	);
}
