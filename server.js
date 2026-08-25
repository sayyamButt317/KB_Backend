import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const { app } = await import("./app.js");
const { connectionDB } = await import("./src/db/connection.js");
const chalk = (await import("chalk")).default;
const { createServer } = await import("http");
const { Server } = await import("socket.io");
const { default: registerEmbeddingEvents } = await import(
  "./src/Queue-Event/embedding.events.js"
);

const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://kb-client.vercel.app",
    ],
    credentials: true,
  },
});

registerEmbeddingEvents(io);

connectionDB()
  .then(() => {
    server.listen(8000, () => {
      console.log(chalk.bgBlue(`Server running on port ${8000}`));
    });
  })
  .catch((err) => console.log(`Qdrant connection failed`, err));
