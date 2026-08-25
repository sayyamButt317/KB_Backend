import express from "express";
import cors from "cors";
import Routes from "./src/Routes/routes.js";
import morgan from "morgan";

const app = express();

const corsOptions = {
  origin: ['http://localhost:3000','https://kb-client.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Routes Declaration
app.use("/api/v1", Routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

export { app };
