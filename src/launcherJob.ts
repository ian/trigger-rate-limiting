import { task } from "@trigger.dev/sdk/v3";
import { rateLimitedJob } from "./rateLimitedJob";

export const launcherJob = task({
	id: "launcherJob",
	run: async () => {
		await rateLimitedJob.batchTriggerAndWait(
			new Array(10).fill(0).map((_, i) => ({
				payload: {
					sequence: i,
				},
			})),
		);
		
		return `DONE`;
	},
});
