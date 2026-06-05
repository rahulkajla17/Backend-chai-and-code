import { application } from "express";
import connectDB from "../db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at PORT : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed!!", err);
  });

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import express from "express";
// import { connect } from "node:http2";

// dotenv.config({
//   path: "./.env",
// });

// const app = express();
// import { DB_NAME } from "./constants.js";
// import { error } from "node:console";

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("error", error);
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`the app is listing at ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log("Error:", error);
//     throw error;
//   }
// })();
