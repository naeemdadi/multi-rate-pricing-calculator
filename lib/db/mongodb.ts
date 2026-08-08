import { mongoClientPromise, getMongoDbName } from "@/lib/mongodb";
import type { Db } from "mongodb";

export async function getAppDb(): Promise<Db> {
  const client = await mongoClientPromise;
  const dbName = await getMongoDbName();
  return client.db(dbName);
}
