import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// import dotenv from "dotenv";

// dotenv.config({
//   path: "./.env",
// });

const connectDB = async () => {
  try {
    const db_connection = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    // console.log("\n MongoDb connected, HOST : ", db_connection.connection);
  } catch (error) {
    console.log("Database connection Error : ", error);
    process.exit(1);
  }
};

export default connectDB;
