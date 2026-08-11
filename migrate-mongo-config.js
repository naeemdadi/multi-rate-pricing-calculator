import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const config = {
  mongodb: {
    url: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017",
    databaseName: process.env.MONGODB_DB ?? "multi-rate-pricing-calculator",
    options: {},
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  lockCollectionName: "changelog_lock",
  lockTtl: 0,
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: "esm",
};

export default config;