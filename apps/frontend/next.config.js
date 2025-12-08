/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
	output: "standalone",
	// Required for monorepo: tells Next.js where the root is for dependency tracing
	outputFileTracingRoot: path.join(__dirname, "../../"),
	transpilePackages: ["@uptimebeacon/database"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
};

export default config;
