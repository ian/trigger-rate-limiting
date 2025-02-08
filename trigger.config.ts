import { defineConfig, timeout } from "@trigger.dev/sdk/v3";

export default defineConfig({
	project: process.env.TRIGGER_PROJECT_ID as string,
	runtime: "node",
	logLevel: "log",
	dirs: ["src"],
	maxDuration: timeout.None,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	}
});
