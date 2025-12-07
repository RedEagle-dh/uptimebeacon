"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(event.currentTarget);
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError("Invalid email or password");
			} else {
				router.push("/dashboard");
				router.refresh();
			}
		} catch (_error) {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<form className="grid gap-4" onSubmit={onSubmit}>
			<div className="grid gap-2">
				<Label className="font-medium text-sm" htmlFor="email">
					Email
				</Label>
				<Input
					autoCapitalize="none"
					autoComplete="email"
					autoCorrect="off"
					className="h-11 text-base sm:h-10 sm:text-sm"
					disabled={isLoading}
					id="email"
					name="email"
					placeholder="name@example.com"
					required
					type="email"
				/>
			</div>
			<div className="grid gap-2">
				<Label className="font-medium text-sm" htmlFor="password">
					Password
				</Label>
				<Input
					autoComplete="current-password"
					className="h-11 text-base sm:h-10 sm:text-sm"
					disabled={isLoading}
					id="password"
					name="password"
					placeholder="Enter your password"
					required
					type="password"
				/>
			</div>

			{error && (
				<div className="rounded-lg bg-destructive/10 px-3 py-2.5 text-destructive text-sm">
					{error}
				</div>
			)}

			<Button
				className="h-11 text-base sm:h-10 sm:text-sm"
				disabled={isLoading}
				type="submit"
			>
				{isLoading ? (
					<>
						<Loader2 className="mr-2 size-4 animate-spin" />
						Signing in...
					</>
				) : (
					"Sign in"
				)}
			</Button>
		</form>
	);
}
