"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/trpc/react";

type MonitorType =
	| "HTTP"
	| "HTTPS"
	| "TCP"
	| "PING"
	| "DNS"
	| "KEYWORD"
	| "JSON_QUERY";
type HttpMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "DELETE"
	| "PATCH"
	| "HEAD"
	| "OPTIONS";
type AuthMethod = "none" | "basic" | "bearer";

interface MonitorData {
	id: string;
	name: string;
	description: string | null;
	type: string;
	url: string | null;
	hostname: string | null;
	port: number | null;
	method: string | null;
	interval: number;
	timeout: number;
	retries: number;
	retryInterval: number;
	expectedStatusCodes: number[];
	headers: unknown;
	body: string | null;
	keyword: string | null;
	keywordType: string | null;
	jsonPath: string | null;
	expectedValue: string | null;
	ignoreTls: boolean;
	tlsExpiry: boolean;
	tlsExpiryDays: number;
	authMethod: string | null;
	authUser: string | null;
	authPass: string | null;
	authToken: string | null;
}

interface MonitorFormClientProps {
	monitor?: MonitorData;
}

export function MonitorFormClient({ monitor }: MonitorFormClientProps) {
	const router = useRouter();
	const isEditMode = !!monitor;

	const createMutation = api.monitor.create.useMutation({
		onSuccess: () => {
			toast.success("Monitor created successfully");
			router.push("/dashboard/monitors");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create monitor");
		},
	});

	const updateMutation = api.monitor.update.useMutation({
		onSuccess: () => {
			toast.success("Monitor updated successfully");
			router.push(`/dashboard/monitors/${monitor?.id}`);
		},
		onError: (error) => {
			toast.error(error.message || "Failed to update monitor");
		},
	});

	// Basic info
	const [name, setName] = useState(monitor?.name ?? "");
	const [description, setDescription] = useState(monitor?.description ?? "");
	const [type, setType] = useState<MonitorType>(
		(monitor?.type as MonitorType) ?? "HTTP",
	);

	// Connection settings
	const [url, setUrl] = useState(monitor?.url ?? "");
	const [hostname, setHostname] = useState(monitor?.hostname ?? "");
	const [port, setPort] = useState<number | undefined>(
		monitor?.port ?? undefined,
	);
	const [method, setMethod] = useState<HttpMethod>(
		(monitor?.method as HttpMethod) ?? "GET",
	);

	// Check settings
	const [interval, setInterval] = useState(monitor?.interval ?? 60);
	const [timeout, setTimeout] = useState(monitor?.timeout ?? 30);
	const [retries, setRetries] = useState(monitor?.retries ?? 3);
	const [retryInterval, setRetryInterval] = useState(
		monitor?.retryInterval ?? 60,
	);

	// HTTP settings
	const [expectedStatusCodes, setExpectedStatusCodes] = useState(
		monitor?.expectedStatusCodes?.join(", ") ?? "200, 201, 204",
	);
	const [headers, setHeaders] = useState(
		monitor?.headers ? JSON.stringify(monitor.headers, null, 2) : "",
	);
	const [body, setBody] = useState(monitor?.body ?? "");

	// Keyword/JSON settings
	const [keyword, setKeyword] = useState(monitor?.keyword ?? "");
	const [keywordType, setKeywordType] = useState<"present" | "absent">(
		(monitor?.keywordType as "present" | "absent") ?? "present",
	);
	const [jsonPath, setJsonPath] = useState(monitor?.jsonPath ?? "");
	const [expectedValue, setExpectedValue] = useState(
		monitor?.expectedValue ?? "",
	);

	// TLS settings
	const [ignoreTls, setIgnoreTls] = useState(monitor?.ignoreTls ?? false);
	const [tlsExpiry, setTlsExpiry] = useState(monitor?.tlsExpiry ?? true);
	const [tlsExpiryDays, setTlsExpiryDays] = useState(
		monitor?.tlsExpiryDays ?? 7,
	);

	// Authentication
	const [authMethod, setAuthMethod] = useState<AuthMethod>(
		(monitor?.authMethod as AuthMethod) ?? "none",
	);
	const [authUser, setAuthUser] = useState(monitor?.authUser ?? "");
	const [authPass, setAuthPass] = useState(monitor?.authPass ?? "");
	const [authToken, setAuthToken] = useState(monitor?.authToken ?? "");

	const isHttpType =
		type === "HTTP" ||
		type === "HTTPS" ||
		type === "KEYWORD" ||
		type === "JSON_QUERY";
	const needsUrl = isHttpType;
	const needsHostname = type === "TCP" || type === "PING" || type === "DNS";
	const needsPort = type === "TCP";
	const showKeywordSettings = type === "KEYWORD";
	const showJsonSettings = type === "JSON_QUERY";
	const showTlsSettings = type === "HTTPS";
	const showHttpSettings = isHttpType;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Parse expected status codes
		const statusCodes = expectedStatusCodes
			.split(",")
			.map((s) => Number.parseInt(s.trim(), 10))
			.filter((n) => !Number.isNaN(n));

		// Parse headers JSON
		let parsedHeaders: Record<string, string> | undefined;
		if (headers.trim()) {
			try {
				parsedHeaders = JSON.parse(headers);
			} catch {
				toast.error("Invalid JSON in headers field");
				return;
			}
		}

		const data = {
			name,
			description: description || undefined,
			type,
			url: needsUrl ? url : undefined,
			hostname: needsHostname ? hostname : undefined,
			port: needsPort ? port : undefined,
			method,
			interval,
			timeout,
			retries,
			retryInterval,
			expectedStatusCodes: statusCodes,
			headers: parsedHeaders,
			body: body || undefined,
			keyword: showKeywordSettings ? keyword : undefined,
			keywordType: showKeywordSettings ? keywordType : undefined,
			jsonPath: showJsonSettings ? jsonPath : undefined,
			expectedValue: showJsonSettings ? expectedValue : undefined,
			ignoreTls,
			tlsExpiry,
			tlsExpiryDays,
			authMethod: authMethod !== "none" ? authMethod : undefined,
			authUser: authMethod === "basic" ? authUser : undefined,
			authPass: authMethod === "basic" ? authPass : undefined,
			authToken: authMethod === "bearer" ? authToken : undefined,
		};

		if (isEditMode && monitor) {
			updateMutation.mutate({ id: monitor.id, data });
		} else {
			createMutation.mutate(data);
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;
	const backLink = isEditMode
		? `/dashboard/monitors/${monitor?.id}`
		: "/dashboard/monitors";

	return (
		<div className="space-y-6">
			{/* Page header */}
			<div className="flex items-center gap-4">
				<Button asChild size="icon" variant="ghost">
					<Link href={backLink}>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						{isEditMode ? "Edit Monitor" : "Add Monitor"}
					</h1>
					<p className="mt-1 text-muted-foreground">
						{isEditMode
							? `Update the configuration for ${monitor?.name}`
							: "Create a new monitor to track your service uptime"}
					</p>
				</div>
			</div>

			<form className="space-y-6" onSubmit={handleSubmit}>
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
						<CardDescription>
							Give your monitor a name and select the type of check
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									onChange={(e) => setName(e.target.value)}
									placeholder="My Website"
									required
									value={name}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="type">Monitor Type *</Label>
								<Select
									onValueChange={(v) => setType(v as MonitorType)}
									value={type}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="HTTP">HTTP</SelectItem>
										<SelectItem value="HTTPS">HTTPS</SelectItem>
										<SelectItem value="TCP">TCP Port</SelectItem>
										<SelectItem value="PING">Ping</SelectItem>
										<SelectItem value="DNS">DNS</SelectItem>
										<SelectItem value="KEYWORD">Keyword</SelectItem>
										<SelectItem value="JSON_QUERY">JSON Query</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Optional description for this monitor"
								rows={2}
								value={description}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Connection Settings */}
				<Card>
					<CardHeader>
						<CardTitle>Connection Settings</CardTitle>
						<CardDescription>
							Configure the target endpoint to monitor
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{needsUrl && (
							<div className="space-y-2">
								<Label htmlFor="url">URL *</Label>
								<Input
									id="url"
									onChange={(e) => setUrl(e.target.value)}
									placeholder="https://example.com"
									required
									type="url"
									value={url}
								/>
							</div>
						)}

						{needsHostname && (
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="hostname">Hostname *</Label>
									<Input
										id="hostname"
										onChange={(e) => setHostname(e.target.value)}
										placeholder="example.com"
										required
										value={hostname}
									/>
								</div>
								{needsPort && (
									<div className="space-y-2">
										<Label htmlFor="port">Port *</Label>
										<Input
											id="port"
											max={65535}
											min={1}
											onChange={(e) =>
												setPort(
													e.target.value
														? Number.parseInt(e.target.value, 10)
														: undefined,
												)
											}
											placeholder="443"
											required
											type="number"
											value={port ?? ""}
										/>
									</div>
								)}
							</div>
						)}

						{showHttpSettings && (
							<div className="space-y-2">
								<Label htmlFor="method">HTTP Method</Label>
								<Select
									onValueChange={(v) => setMethod(v as HttpMethod)}
									value={method}
								>
									<SelectTrigger className="w-full md:w-48">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="GET">GET</SelectItem>
										<SelectItem value="POST">POST</SelectItem>
										<SelectItem value="PUT">PUT</SelectItem>
										<SelectItem value="DELETE">DELETE</SelectItem>
										<SelectItem value="PATCH">PATCH</SelectItem>
										<SelectItem value="HEAD">HEAD</SelectItem>
										<SelectItem value="OPTIONS">OPTIONS</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Check Settings */}
				<Card>
					<CardHeader>
						<CardTitle>Check Settings</CardTitle>
						<CardDescription>
							Configure how often and how to check the endpoint
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
							<div className="space-y-2">
								<Label htmlFor="interval">Check Interval (seconds)</Label>
								<Input
									id="interval"
									max={3600}
									min={30}
									onChange={(e) =>
										setInterval(Number.parseInt(e.target.value, 10) || 60)
									}
									type="number"
									value={interval}
								/>
								<p className="text-muted-foreground text-xs">30s - 1 hour</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="timeout">Timeout (seconds)</Label>
								<Input
									id="timeout"
									max={120}
									min={1}
									onChange={(e) =>
										setTimeout(Number.parseInt(e.target.value, 10) || 30)
									}
									type="number"
									value={timeout}
								/>
								<p className="text-muted-foreground text-xs">1s - 2 minutes</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="retries">Retries</Label>
								<Input
									id="retries"
									max={10}
									min={0}
									onChange={(e) =>
										setRetries(Number.parseInt(e.target.value, 10) || 0)
									}
									type="number"
									value={retries}
								/>
								<p className="text-muted-foreground text-xs">0 - 10 retries</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="retryInterval">Retry Interval (seconds)</Label>
								<Input
									id="retryInterval"
									max={300}
									min={10}
									onChange={(e) =>
										setRetryInterval(Number.parseInt(e.target.value, 10) || 60)
									}
									type="number"
									value={retryInterval}
								/>
								<p className="text-muted-foreground text-xs">10s - 5 minutes</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* HTTP Settings */}
				{showHttpSettings && (
					<Card>
						<CardHeader>
							<CardTitle>HTTP Settings</CardTitle>
							<CardDescription>
								Configure expected status codes and request details
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="expectedStatusCodes">
									Expected Status Codes
								</Label>
								<Input
									id="expectedStatusCodes"
									onChange={(e) => setExpectedStatusCodes(e.target.value)}
									placeholder="200, 201, 204"
									value={expectedStatusCodes}
								/>
								<p className="text-muted-foreground text-xs">
									Comma-separated list of HTTP status codes to consider as "up"
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="headers">Custom Headers (JSON)</Label>
								<Textarea
									id="headers"
									onChange={(e) => setHeaders(e.target.value)}
									placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
									rows={3}
									value={headers}
								/>
							</div>

							{(method === "POST" ||
								method === "PUT" ||
								method === "PATCH") && (
								<div className="space-y-2">
									<Label htmlFor="body">Request Body</Label>
									<Textarea
										id="body"
										onChange={(e) => setBody(e.target.value)}
										placeholder='{"key": "value"}'
										rows={4}
										value={body}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Keyword Settings */}
				{showKeywordSettings && (
					<Card>
						<CardHeader>
							<CardTitle>Keyword Settings</CardTitle>
							<CardDescription>
								Check for the presence or absence of a keyword in the response
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="keyword">Keyword *</Label>
									<Input
										id="keyword"
										onChange={(e) => setKeyword(e.target.value)}
										placeholder="success"
										required={showKeywordSettings}
										value={keyword}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="keywordType">Keyword Type</Label>
									<Select
										onValueChange={(v) =>
											setKeywordType(v as "present" | "absent")
										}
										value={keywordType}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="present">
												Present (must contain)
											</SelectItem>
											<SelectItem value="absent">
												Absent (must not contain)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* JSON Query Settings */}
				{showJsonSettings && (
					<Card>
						<CardHeader>
							<CardTitle>JSON Query Settings</CardTitle>
							<CardDescription>
								Check a specific value in a JSON response
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="jsonPath">JSON Path *</Label>
									<Input
										id="jsonPath"
										onChange={(e) => setJsonPath(e.target.value)}
										placeholder="$.status or data.health"
										required={showJsonSettings}
										value={jsonPath}
									/>
									<p className="text-muted-foreground text-xs">
										JSONPath expression or dot notation
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="expectedValue">Expected Value *</Label>
									<Input
										id="expectedValue"
										onChange={(e) => setExpectedValue(e.target.value)}
										placeholder="ok"
										required={showJsonSettings}
										value={expectedValue}
									/>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* TLS Settings */}
				{showTlsSettings && (
					<Card>
						<CardHeader>
							<CardTitle>TLS/SSL Settings</CardTitle>
							<CardDescription>
								Configure certificate verification settings
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm">Ignore TLS Errors</p>
									<p className="text-muted-foreground text-xs">
										Skip certificate validation (not recommended)
									</p>
								</div>
								<Switch checked={ignoreTls} onCheckedChange={setIgnoreTls} />
							</div>

							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium text-sm">
										Monitor Certificate Expiry
									</p>
									<p className="text-muted-foreground text-xs">
										Alert when certificate is about to expire
									</p>
								</div>
								<Switch checked={tlsExpiry} onCheckedChange={setTlsExpiry} />
							</div>

							{tlsExpiry && (
								<div className="space-y-2">
									<Label htmlFor="tlsExpiryDays">
										Alert Days Before Expiry
									</Label>
									<Input
										id="tlsExpiryDays"
										max={90}
										min={1}
										onChange={(e) =>
											setTlsExpiryDays(Number.parseInt(e.target.value, 10) || 7)
										}
										type="number"
										value={tlsExpiryDays}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Authentication */}
				{showHttpSettings && (
					<Card>
						<CardHeader>
							<CardTitle>Authentication</CardTitle>
							<CardDescription>
								Configure authentication for the request
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="authMethod">Authentication Method</Label>
								<Select
									onValueChange={(v) => setAuthMethod(v as AuthMethod)}
									value={authMethod}
								>
									<SelectTrigger className="w-full md:w-48">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">None</SelectItem>
										<SelectItem value="basic">Basic Auth</SelectItem>
										<SelectItem value="bearer">Bearer Token</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{authMethod === "basic" && (
								<div className="grid gap-4 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="authUser">Username</Label>
										<Input
											id="authUser"
											onChange={(e) => setAuthUser(e.target.value)}
											placeholder="username"
											value={authUser}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="authPass">Password</Label>
										<Input
											id="authPass"
											onChange={(e) => setAuthPass(e.target.value)}
											placeholder="password"
											type="password"
											value={authPass}
										/>
									</div>
								</div>
							)}

							{authMethod === "bearer" && (
								<div className="space-y-2">
									<Label htmlFor="authToken">Bearer Token</Label>
									<Input
										id="authToken"
										onChange={(e) => setAuthToken(e.target.value)}
										placeholder="your-bearer-token"
										type="password"
										value={authToken}
									/>
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{/* Submit */}
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
					<Button asChild variant="outline">
						<Link href={backLink}>Cancel</Link>
					</Button>
					<Button disabled={isPending} type="submit">
						{isPending
							? isEditMode
								? "Saving..."
								: "Creating..."
							: isEditMode
								? "Save Changes"
								: "Create Monitor"}
					</Button>
				</div>
			</form>
		</div>
	);
}

/** @deprecated Use MonitorFormClient instead */
export const NewMonitorClient = MonitorFormClient;
