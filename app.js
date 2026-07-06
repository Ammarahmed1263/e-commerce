import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import setupSwagger from "./config/swagger.js";
// import { generalLimiter } from "./config/rateLimiter.js";
import errorHandler from "./utils/errorHandler.js";
import notFound from "./utils/notFound.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoute from "./routes/webhookRoute.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";

const app = express();

app.use("/api/v1/webhooks/stripe", webhookRoute);

app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
      ];
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
// app.use(generalLimiter);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(compression());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

setupSwagger(app);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/", (req, res) => res.status(200).json({ status: "Luxora backend API is running" }));

app.use(notFound);
app.use(errorHandler);

export default app;
