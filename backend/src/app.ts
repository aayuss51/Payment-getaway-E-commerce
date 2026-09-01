import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import vendorRoutes from "./routes/vendorRoutes";
import orderRoutes from "./routes/orderRoutes";

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders", orderRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "BazaarNepal API is running" });
});

export default app;
