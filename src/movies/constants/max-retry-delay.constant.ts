// Upper bound for a single wait between TMDB retries, even if TMDB's
// `Retry-After` asks for longer. Keeps the total retry budget below the
// global request timeout (REQUEST_TIMEOUT_MS in env.validation.ts).
export const maxRetryDelayMs = 5000;
