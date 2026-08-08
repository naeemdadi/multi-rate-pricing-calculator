import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is required");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

export const mongoClientPromise =
  globalThis._mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  globalThis._mongoClientPromise = mongoClientPromise;
}

export async function getMongoDbName() {
  return process.env.MONGODB_DB ?? "multi-rate-pricing-calculator";
}

export async function getMongoClient() {
  return mongoClientPromise;
}

export async function getMongoDb() {
  const client = await mongoClientPromise;
  return client.db(await getMongoDbName());
}
