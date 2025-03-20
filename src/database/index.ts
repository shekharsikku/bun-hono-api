import { connect, ConnectionStates } from "mongoose";
import { Redis } from "ioredis";
import env from "@/utils/env";

const mongodb = async (): Promise<ConnectionStates | null> => {
  try {
    const { connection } = await connect(env.MONGODB_URI);
    return connection.readyState;
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};

declare const globalThis: {
  redis: Redis | undefined;
} & typeof global;

const createRedisClient = () => {
  const redis = new Redis(env.REDIS_URI, {
    retryStrategy: () => null,
  });

  redis.on("connect", () => {
    console.log("Redis connection success!");
  });

  redis.on("error", (error: Error) => {
    console.error("Redis connection error!", error.message);
  });

  return redis;
};

globalThis.redis = globalThis.redis ?? createRedisClient();
const redis = globalThis.redis;

export { mongodb, redis };
