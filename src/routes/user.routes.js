import { Router } from "express";
import {
  registerUser,
  loginuser,
  logoutuser,
  refreshAccessToken,
  changePassword,
  getcurrentuser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getchannelprofile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtverify } from "../middlewares/auth.middleware.js";

const router = Router();
// userrouter.route("/").get(registerUser);
router.route("/register").post(
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

router.route("/login").post(loginuser);

//secured routes
router.route("/logout").post(jwtverify, logoutuser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(jwtverify, changePassword);

router.route("/getcurrentuser").get(jwtverify, getcurrentuser);
router.route("/update-account-details").patch(jwtverify, updateAccountDetails);

router
  .route("/update-user-avatar")
  .patch(jwtverify, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-cover-Image")
  .patch(jwtverify, upload.single("coverImage"), updateUserCoverImage);

router.route("/c/:username").get(jwtverify, getchannelprofile);
router.route("/get-watch-history").get(jwtverify, getWatchHistory);

export { router as userrouter };
