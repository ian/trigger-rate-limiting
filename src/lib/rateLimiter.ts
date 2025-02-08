import Redis from "ioredis";
import { wait } from "@trigger.dev/sdk/v3";

// Sleep time between rate limit checks in milliseconds
const SLEEP_TIME = 3_000;

/**
 * A helper function to rate-limit operations.
 * @param key - A unique key identifying the rate limit bucket.
 * @param limit - The maximum number of tokens (bucket capacity).
 */
export async function rateLimit(key: string, limit: number) {
	// For this example, we use a refill rate of 1 token per minute.
	const rateLimiter = new DistributedRateLimiter(key, limit);
	let allowed = false;

	do {
		allowed = await rateLimiter.acquireToken();
		if (!allowed) {
			console.debug("Rate limited, sleeping 3s");
			// Wait 10 seconds before retrying.
			await wait.until({ date: new Date(Date.now() + SLEEP_TIME) });
		}
	} while (!allowed);

	return allowed;
}

class DistributedRateLimiter {
	private redis: Redis;
	private key: string;
	private maxTokens: number;

	/**
	 * @param key        A unique key to identify the bucket.
	 * @param maxTokens  The maximum capacity of tokens in the bucket.
	 */
	constructor(key: string, maxTokens: number) {
		// Create a Redis client instance.
		this.redis = new Redis(process.env.REDIS_URL as string);
		this.key = key;
		this.maxTokens = maxTokens;
	}

	/**
	 * Attempt to acquire a token from the bucket.
	 * @returns A promise that resolves to true if a token was acquired; false otherwise.
	 */
	async acquireToken(): Promise<boolean> {
		const now = Date.now();
		const currentMinute = Math.floor(now / 60000);

		while (true) {
			try {
				await this.redis.watch(this.key);

				const [tokensStr, lastMinuteStr] = await this.redis.hmget(
					this.key,
					"tokens",
					"last_minute",
				);

				let tokens: number;
				const lastMinute = Number.parseInt(lastMinuteStr ?? "0", 10);

				// Reset tokens if we're in a new minute
				if (lastMinute < currentMinute) {
					tokens = this.maxTokens;
				} else {
					tokens = Number.parseFloat(tokensStr ?? this.maxTokens.toString());
				}

				if (tokens >= 1) {
					const newTokens = tokens - 1;
					const multi = this.redis.multi();
					multi.hmset(this.key, {
						tokens: newTokens.toString(),
						last_minute: currentMinute.toString(),
					});
					const res = await multi.exec();

					if (res === null) continue;
					return true;
				}

				const multi = this.redis.multi();
				multi.hmset(this.key, {
					tokens: tokens.toString(),
					last_minute: currentMinute.toString(),
				});
				await multi.exec();
				return false;
			} finally {
				await this.redis.unwatch();
			}
		}
	}
}
