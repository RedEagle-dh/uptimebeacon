"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

export function RegisterForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const registerMutation = api.user.register.useMutation({
		onSuccess: async (_data, variables) => {
			// Sign in after successful registration
			const result = await signIn("credentials", {
				email: variables.email,
				password: variables.password,
				redirect: false,
			});

			if (result?.error) {
				setError("Account created but login failed. Please try logging in.");
			} else {
				router.push("/dashboard");
				router.refresh();
			}
		},
		onError: (error) => {
			setError(error.message);
		},
		onSettled: () => {
			setIsLoading(false);
		},
	});

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsLoading(true);
		setError(null);

		const formData = new FormData(event.currentTarget);
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;
		const confirmPassword = formData.get("confirmPassword") as string;

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setIsLoading(false);
			return;
		}

		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			setIsLoading(false);
			return;
		}

		registerMutation.mutate({ name, email, password });
	}

	return (
		<form className="grid gap-4" onSubmit={onSubmit}>
			<div className="grid gap-2">
				<Label htmlFor="name">Name</Label>
				<Input
					autoComplete="name"
					className="h-10"
					disabled={isLoading}
					id="name"
					name="name"
					placeholder="Admin"
					required
					type="text"
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="email">Email</Label>
				<Input
					autoCapitalize="none"
					autoComplete="email"
					autoCorrect="off"
					className="h-10"
					disabled={isLoading}
					id="email"
					name="email"
					placeholder="admin@example.com"
					required
					type="email"
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="password">Password</Label>
				<Input
					autoComplete="new-password"
					className="h-10"
					disabled={isLoading}
					id="password"
					name="password"
					placeholder="Create a password"
					required
					type="password"
				/>
			</div>
			<div className="grid gap-2">
				<Label htmlFor="confirmPassword">Confirm Password</Label>
				<Input
					autoComplete="new-password"
					className="h-10"
					disabled={isLoading}
					id="confirmPassword"
					name="confirmPassword"
					placeholder="Confirm your password"
					required
					type="password"
				/>
			</div>

			{error && (
				<div className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive text-sm">
					{error}
				</div>
			)}

			<Button className="h-10" disabled={isLoading} type="submit">
				{isLoading ? (
					<>
						<Loader2 className="mr-2 size-4 animate-spin" />
						Creating account...
					</>
				) : (
					"Create Admin Account"
				)}
			</Button>
		</form>
	);
}
