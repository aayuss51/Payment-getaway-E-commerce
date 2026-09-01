import "dotenv/config";
import app from "./app";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  // Connect to Database
  await connectDB();

  // Vite middleware for development or Static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(__dirname, "../../"), // Point to project root
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "../../dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../../dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
