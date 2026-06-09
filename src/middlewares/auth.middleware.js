import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { apiError } from "../utils/ApiErrors.js";

export const jwtverify = asynchandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer", "");

    console.log("1. TOKEN EXTRACTED: ", token);

    if (!token) {
      throw new apiError(401, "unauthorized request : no token provided");
    }
    const decodedtoken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log("2. TOKEN DECODED: ", decodedtoken);
    const user = await User.findById(decodedtoken?._id)?.select(
      "-password -RefreshToken",
    );

    console.log("3. USER FOUND IN DB: ", user);
    if (!user) {
      throw new apiError(401, "Invalid Access Token : user does not exist");
    }
    req.user = user;
    next();
  } catch (error) {
    console.log("🚨 THE REAL CRASH REASON IS 🚨: ", error);

    throw new apiError(401, error?.message || "Invalid Access Token");
  }
});
