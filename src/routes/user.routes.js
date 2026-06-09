import { Router } from "express";
import {
  registerUser,
  loginuser,
  logoutuser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtverify } from "../middlewares/auth.middleware.js";

const userrouter = Router();
// userrouter.route("/").get(registerUser);
userrouter.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

userrouter.route("/login").post(loginuser);

//secured routes
userrouter.route("/logout").post(jwtverify, logoutuser);
export { userrouter };
