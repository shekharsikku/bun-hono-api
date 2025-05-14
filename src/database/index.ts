import { MongoClient, GridFSBucket, ServerApiVersion } from "mongodb";
import { connect, ConnectionStates } from "mongoose";
import { Redis } from "ioredis";
import env from "~/utils/env";

declare const globalThis: {
  redis: Redis | undefined;
  mongo: MongoClient | undefined;
  bucket: GridFSBucket | undefined;
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

const createMongoClient = () => {
  const mongo = new MongoClient(env.MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  mongo.on("open", () => {
    console.log("Mongo connection success!");
  });

  mongo.on("error", (error: Error) => {
    console.error("Mongo connection error!", error.message);
  });

  return mongo;
};

globalThis.mongo = globalThis.mongo ?? createMongoClient();
const mongo = globalThis.mongo;

const mongodb = async (): Promise<ConnectionStates | null> => {
  try {
    const { connection } = await connect(env.MONGODB_URI);
    connection.readyState && (await mongo.connect());
    return connection.readyState;
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};

const database = mongo.db(env.BUCKET_DB_NAME);
const bucket = new GridFSBucket(database, { bucketName: env.BUCKET_PREFIX });

export { bucket, mongodb, redis };
