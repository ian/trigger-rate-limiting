# Trigger Rate Limiting

This is a simple example of how to rate limit jobs in Trigger.dev using Redis.

## Running the example

1. Clone the repository
2. Run `pnpm install`
3. Run `pnpm dev`
4. In trigger dashboard, run the `launcherJob`

## Usage

The `rateLimit` function is a helper function that limits the number of times a job can run per minute.

```ts
import { task } from "@trigger.dev/sdk/v3";
import { rateLimit } from "./lib/rateLimiter";

export const rateLimitedJob = task({
  id: "rateLimitedJob",
  run: async (payload: Payload) => {
  
    // This limits the job to 5 runs per minute.
    await rateLimit("testJob", 5);

    // ... other code

    return "DONE";
  },
});
```

## How it works

See the `src/lib/rateLimiter.ts` file for the rate limiting logic.

The Redis rate limiting implementation employs a token bucket algorithm with a distributed Redis backend. At its core, it maintains two crucial pieces of information in a Redis Hash: the current token count and the last minute timestamp. This data structure allows for efficient tracking of rate limits across distributed systems.

The token consumption process is handled through atomic operations using Redis WATCH/MULTI transactions, which prevent race conditions in distributed environments. When a token is requested, the system first checks if we've entered a new minute - if so, the bucket automatically refills to maximum capacity; if not, it works with the existing token count. If a token is available (count >= 1), it decrements the count and updates the timestamp in a single atomic transaction, with automatic retry logic if the transaction fails due to concurrent access.

## Notes

One aspect of this implementation is that it resets to full capacity at the start of each new minute, rather than gradually refilling tokens over time. This design choice means that it's possible to consume maxTokens requests in the final moments of one minute and immediately consume another maxTokens requests at the beginning of the next minute. While this might create brief periods of higher throughput at minute boundaries, the implementation remains robust and consistent for distributed systems, effectively managing rate limits across multiple instances.
