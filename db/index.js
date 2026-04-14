import mongoose from "mongoose";
import { DB_NAME } from "../src/constants.js";

const connectDB = async () => {
  try {
    const db_connection = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log("\n MongoDb connected, HOST : ", db_connection.connection);
  } catch (error) {
    console.log("database connection Error : ", error);
    process.exit(1);
  }
};

export default connectDB;
