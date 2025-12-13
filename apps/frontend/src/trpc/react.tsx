"use client";

import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	httpBatchStreamLink,
	httpLink,
	loggerLink,
	type TRPCLink,
} from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";

import { env } from "@/env";
import type { AppRouter } from "@/server/api/root";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined;
const getQueryClient = () => {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return createQueryClient();
	}
	// Browser: use singleton pattern to keep the same query client
	clientQueryClientSingleton ??= createQueryClient();

	return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Get the appropriate tRPC link based on configuration.
 * Use httpLink (no batching) when behind a WAF like Cloudflare that blocks commas in URLs.
 * Use httpBatchStreamLink (batching) for better performance when not behind such a WAF.
 */
function getTrpcLink(): TRPCLink<AppRouter> {
	const linkConfig = {
		transformer: SuperJSON,
		url: `${getBaseUrl()}/api/trpc`,
		headers: () => {
			const headers = new Headers();
			headers.set("x-trpc-source", "nextjs-react");
			return headers;
		},
	};

	// Disable batching if configured (e.g., when behind Cloudflare WAF)
	if (env.NEXT_PUBLIC_TRPC_BATCH_DISABLED) {
		return httpLink(linkConfig);
	}

	return httpBatchStreamLink(linkConfig);
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	const [trpcClient] = useState(() =>
		api.createClient({
			links: [
				loggerLink({
					enabled: (op) =>
						process.env.NODE_ENV === "development" ||
						(op.direction === "down" && op.result instanceof Error),
				}),
				getTrpcLink(),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<api.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</api.Provider>
		</QueryClientProvider>
	);
}

function getBaseUrl() {
	if (typeof window !== "undefined") return window.location.origin;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
