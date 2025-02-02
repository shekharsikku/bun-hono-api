import { cleanEnv, str, url, num, port } from "envalid";

const env = cleanEnv(process.env, {
  IMAGEKIT_PUBLIC_KEY: str(),
  IMAGEKIT_PRIVATE_KEY: str(),
  IMAGEKIT_URL_ENDPOINT: url(),

  ACCESS_SECRET: str(),
  ACCESS_EXPIRY: num(),

  REFRESH_SECRET: str(),
  REFRESH_EXPIRY: num(),

  MONGODB_URI: url(),
  CORS_ORIGIN: str(),
  PORT: port(),

  BODY_LIMIT: num(),
  NODE_ENV: str({ choices: ["development", "production"] }),
});

export default env;
