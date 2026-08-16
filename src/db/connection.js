import { QdrantClient } from "@qdrant/js-client-rest";

import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();
let qdrantClient;

const connectionDB = async () => {
  try {
    qdrantClient = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    console.log(chalk.green("✅ Qdrant connected successfully"));
  } catch (error) {
    console.log(chalk.bgRed("❌ Qdrant connection failed"), error);
    process.exit(1);
  }
};
export { connectionDB, qdrantClient };
