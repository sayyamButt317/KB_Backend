import express from "express";
import cors from "cors";
import Routes from "./src/Routes/ai.routes.js";
import morgan from "morgan";

const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(cors());

// Routes Declaration
app.use("/", Routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

export { app };