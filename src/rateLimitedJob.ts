import { task } from "@trigger.dev/sdk/v3";
import { rateLimit } from "./lib/rateLimiter";

export type Payload = {
	sequence: number;
};

export const rateLimitedJob = task({
	id: "rateLimitedJob",
	run: async (payload: Payload) => {
		const { sequence } = payload;

    // limits the job to 5 runs per minute
		await rateLimit("testJob", 5);
		
		return `Sequence ${sequence} finished`;
	},
});
