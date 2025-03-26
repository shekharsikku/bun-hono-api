import { cleanEnv, str, url, num, port } from "envalid";

const env = cleanEnv(process.env, {
  IMAGEKIT_PUBLIC_KEY: str(),
  IMAGEKIT_PRIVATE_KEY: str(),
  IMAGEKIT_URL_ENDPOINT: url(),

  RESEND_API_KEY: str(),
  RESEND_ORIGIN: str(),

  ACCESS_SECRET: str(),
  ACCESS_EXPIRY: num(),

  REFRESH_SECRET: str(),
  REFRESH_EXPIRY: num(),

  MONGODB_URI: url(),
  REDIS_URI: url(),
  CORS_ORIGIN: str(),
  PORT: port(),
  SOCKET_PORT: port(),

  BUCKET_DB_NAME: str({ default: "bucket" }),
  BUCKET_PREFIX: str({ default: "uploads" }),

  BODY_LIMIT: num({ default: 128 }),
  NODE_ENV: str({
    choices: ["development", "production"],
    default: "development",
  }),
});

export default env;
