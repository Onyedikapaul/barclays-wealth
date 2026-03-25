import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import UserRouter from "./route/userRouter.js";
import TransactionRouter from "./route/transactionRoutes.js";
import TransferRouter from "./route/transferRoute.js";
import WireTransferRouter from "./route/wireTransferRoutes.js";
import CheckDepositRouter from "./route/checkDepositRoutes.js";
import TicketRouter from "./route/ticketsRoute.js";
import AdminTicketRouter from "./route/adminTicketsRoute.js";
import SecuritySettingsRouter from "./route/securitySettingsRoutes.js";
import CardRouter from "./route/cardRoutes.js";
import AdminRouter from "./route/adminRoute.js";
import AdminCreditUserRouter from "./route/adminTransferRoutes.js";
import AdminEmailRouter from "./route/adminEmailRoutes.js";
import AdminAuthRouter from "./route/adminAuthRoutes.js";
import CaptchaRouter from "./route/CaptchaRoute.js";
import AdminWireTransferRouter from "./route/adminWireTransferRouter.js";

const app = express();
const port = process.env.PORT || 4000;

connectDB();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed origins
const allowedOrigins = new Set([
  "http://localhost:4000",
  "http://127.0.0.1:5500",
  "https://bw-web-ing-uk.pro",
  "https://www.bw-web-ing-uk.pro",
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow non-browser tools like Postman (no Origin header)
      if (!origin) return cb(null, true);
      return allowedOrigins.has(origin)
        ? cb(null, true)
        : cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// Middleware
app.use(cookieParser());

app.use(express.json());

// // Serve HTML/CSS/JS (same folder)
app.use(express.static(__dirname));

// Test route
app.get("/", (req, res) => {
  res.send("API Is Working");
});

app.use("/api", UserRouter);
app.use("/api", TransactionRouter);
app.use("/api", TransferRouter);
app.use("/api/wire-transfer", WireTransferRouter);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/check-deposit", CheckDepositRouter);

app.use("/api/tickets", TicketRouter);
app.use("/api/admin/tickets", AdminTicketRouter);

app.use("/api/account", SecuritySettingsRouter);

app.use("/api/cards", CardRouter);

// Admin routes
app.use("/api/admin", AdminRouter);

app.use("/api/admin/messages", AdminEmailRouter);

app.use("/api/admin", AdminCreditUserRouter);

app.use("/api/admin/auth", AdminAuthRouter);

app.use("/api/admin/wire-transfers", AdminWireTransferRouter);


//Captcha
app.use("/api", CaptchaRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
