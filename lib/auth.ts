import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getMongoClient, getMongoDb } from "@/lib/mongodb";

const db = await getMongoDb();
const client = await getMongoClient();

export const auth = betterAuth({
  database: mongodbAdapter(db, {
    client,
    transaction: false,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: Array.from(
    new Set(
      [
        process.env.BETTER_AUTH_URL,
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        "http://localhost:3000",
      ].filter(Boolean) as string[],
    ),
  ),
});
