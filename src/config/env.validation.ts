import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ============== DATABASE ==============
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  // ============== ADMIN ==============
  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().required(),
  ADMIN_NAME: Joi.string().required(),
  // ============== BETTER AUTH ==============
  BETTER_AUTH_SECRET: Joi.string().required(),
  // ============== TMDB ==============
  TMDB_API_KEY: Joi.string().required(),
  TMDB_API_READ_ACCESS_TOKEN: Joi.string().required(),
  TMDB_BASE_URL: Joi.string().required(),
  TMDB_ACCOUNT_ID: Joi.string().required(),
  TMDB_CACHE_TTL_MS: Joi.number().required(),
  TMDB_RETRY_ATTEMPTS: Joi.number().required(),
  TMDB_FETCH_TIMEOUT_MS: Joi.number().required(),
  // ============== APPLICATION ==============
  NODE_ENV: Joi.string().valid('development', 'production').required(),
  PORT: Joi.number().default(3000),
  // Must stay above the TMDB retry budget (attempts x fetch timeout + waits):
  // with 3 retries and a 10 s fetch timeout the worst case is ~55 s.
  REQUEST_TIMEOUT_MS: Joi.number().integer().min(1).default(60_000),
  // ============== JWT ==============
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  BCRYPT_SALT_ROUNDS: Joi.number().min(10).required(),
  // ============== RATE LIMITING ==============
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(60),
  THROTTLE_TTL_MS: Joi.number().integer().min(1).default(60_000),
  AUTH_THROTTLE_LIMIT: Joi.number().integer().min(1).default(10),
  AUTH_THROTTLE_TTL_MS: Joi.number().integer().min(1).default(60_000),
  // ============== CORS ==============
  CORS_ORIGIN: Joi.string().required(),
});
