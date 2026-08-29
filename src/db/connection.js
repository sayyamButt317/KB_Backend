import { QdrantClient } from "@qdrant/js-client-rest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";
import { tenantCollectionName } from "../Utils/tenant.js";

dotenv.config();
let qdrantClient;

async function ensurePayloadIndex(client, fieldName) {
  const collection = tenantCollectionName();
  try {
    await client.createPayloadIndex(collection, {
      field_name: fieldName,
      field_schema: "keyword",
      wait: true,
    });
    console.log(chalk.green(`✅ Qdrant index ready: ${fieldName}`));
  } catch (error) {
    const msg = String(error?.message || error);
    if (
      msg.toLowerCase().includes("already") ||
      msg.toLowerCase().includes("exists") ||
      error?.status === 409
    ) {
      return;
    }
    console.log(chalk.yellow(`⚠️ Could not create index ${fieldName}: ${msg}`));
  }
}

const connectionDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGO_DB_NAME,
    });
    console.log(
      chalk.green(
        `Connected to ${connectionInstance.connection.host} database! ✅`
      )
    );

    qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      checkCompatibility: false,
    });
    console.log(chalk.green("✅ Qdrant connected successfully"));
    await ensurePayloadIndex(qdrantClient, "metadata.companyId");
    await ensurePayloadIndex(qdrantClient, "metadata.documentId");
  } catch (error) {
    console.log(chalk.bgRed("❌ MongoDB connection failed"), error);
    console.log(chalk.bgRed("❌ Qdrant connection failed"), error);
    process.exit(1);
  }
};
export { connectionDB, qdrantClient };
