import dotenv from "dotenv";
import { app } from "./app.js";
import { connectionDB } from "./src/db/connection.js";
import chalk from "chalk";
import { createServer } from "http";
import { Server } from "socket.io";
import registerEmbeddingEvents from "./src/Queue-Event/embedding.events.js";

dotenv.config({ path: "./.env" });

const server = createServer(app);
export const io = new Server(server, { cors: { origin: "*" } });

registerEmbeddingEvents(io);

connectionDB()
  .then(() => {
    server.listen(8000, () => {
      console.log(chalk.bgBlue(`Server running on port ${8000}`));
    });
  })
  .catch((err) => console.log(`Qdrant connection failed`, err));
