import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true,
  }),
);

app.use(express.json({ limit: "16KB" }));
app.use(express.urlencoded({ limit: "16KB", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

import { userrouter } from "../routes/user.routes.js";
app.use("/api/v1/users", userrouter);

export { app };
