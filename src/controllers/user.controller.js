import { asynchandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { apiresponse } from "../utils/ApiResponse.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { access } from "node:fs";
import { error } from "node:console";
import { response } from "express";
import mongoose from "mongoose";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generaterefreshToken();

    user.RefreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });

    return { AccessToken, RefreshToken };
  } catch {
    throw new apiError(
      400,
      " somethig went wrong while generating the access and refresh token",
    );
  }
};
const registerUser = asynchandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  console.log("email", email);
  console.log(req.body);
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "All fields are required");
  }

  const ExistedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (ExistedUser) {
    throw new apiError(409, "User with this username or email already exist");
  }

  const avatarlocalPath = req.files?.avatar?.[0]?.path;
  const coverImagelocalPath = req.files?.coverImage?.[0]?.path;
  console.log(avatarlocalPath);

  if (!avatarlocalPath) {
    throw new apiError(400, "avatar file is required");
  }

  const avatar = await uploadonCloudinary(avatarlocalPath);
  const coverImage = await uploadonCloudinary(coverImagelocalPath);

  if (!avatar) {
    throw new apiError(400, "avatar file is required again");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
    email,
  });

  const UserCreated = await User.findById(user._id).select(
    "-password -refreshtoken",
  );

  if (!UserCreated) {
    throw new apiError(500, "something went wrong while registring the user");
  }

  return res
    .status(202)
    .json(new apiresponse(200, UserCreated, "user succesfully created"));
});

// login user **********
//   get username and email from req.body
// check if you got email and username
// check if user exist
// verify the user with password
// access and refresh token
// cookie

const loginuser = asynchandler(async (req, res) => {
  const { email, username, password } = req.body;
  // console.log("REQ BODY: ", req.body);

  if (!email && !username) {
    throw new apiError(400, "email and username is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new apiError(404, "user does not exist");
  }

  const ispasswordValid = await user.isPasswrodcorrect(password);

  if (!ispasswordValid) {
    throw new apiError(401, "password is incorrect");
  }

  const { RefreshToken, AccessToken } = await generateAccessandRefreshToken(
    user._id,
  );

  const loggedinUser = await User.findById(user._id).select(
    "-password -RefreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accesstoken", AccessToken, options)
    .cookie("refreshtoken", RefreshToken, options)
    .json(
      new apiresponse(
        200,
        {
          user: loggedinUser,
          AccessToken,
          RefreshToken,
        },
        "user logged in succesfully",
      ),
    );
});

const logoutuser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshtoken: 1
      }
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(new apiresponse(200, {}, "user loggedout succesfully"));
});

const refreshAccessToken = asynchandler(async (req, res) => {
  const incomingresfreshtoken =
    req.cookies.refreshtoken || req.body.refreshtoken;

  if (!incomingresfreshtoken) {
    throw new apiError(401, "unauthorized request ");
  }

  const decodedToken = jwt.verify(
    incomingresfreshtoken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  try {
    const user = User.findById(decodedToken?._id);
    if (!user) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (incomingresfreshtoken !== user?.refreshtoken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { refreshtoken, newaccesstoken } =
      await generateAccessandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accesstoken", newaccesstoken)
      .cookie("refreshtoken", refreshtoken)
      .json(
        new apiresponse(
          200,
          {
            refreshtoken,
            accesstoken: newaccesstoken,
          },
          "acess token refreshed",
        ),
      );
  } catch (error) {
    throw new apiError(401, error?.message || "Invalid refresh token ");
  }
});

const changePassword = asynchandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswrodcorrect(oldpassword);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Invalid old password");
  }

  user.password = newpassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiresponse(200, {}, "password change successfully"));
});

const getcurrentuser = asynchandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiresponse(200), req.user, "user fetched successfully");
});

const updateAccountDetails = asynchandler(async (req, res) => {
  const { email, fullName } = req.body;
  if (!email || !fullName) {
    throw new apiError(400, " all field are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asynchandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new apiError(400, {}, "avatar file is missing");
  }
  const avatar = await uploadonCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new apiError(400, {}, "error while uploading avatar on cloundaniry");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

const updateUserCoverImage = asynchandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }
  //TODO: delete old image - assignment
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});


const getchannelprofile = asynchandler(async (req, res) => {
  const { username } = req.params
  
  if (!username?.trim()) {
    throw new apiError(400, "username not found")
  }

  const channel = User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "Subscription",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      }
    }, {
      $addFields: {
        subscribersCount: {
          $size : "$subscribers"
        },
      channelsSubscribedToCount: {
            $size : "$subscribedTo"
        },
        isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }

      }
    }, {
      $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
      }
    }

  ])

  if (!channel?.lenght) {
    throw new apiError(400, "channel does not exist")
  }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asynchandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField : "_id",
              as: "owner",
              pipeline: [{
                $project : {
                  fullName: 1,
                  username : 1,
                  avatar : 1
                }
              }

              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first : "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
    .status(200)
  .json(
    new apiresponse(200,user[0].watchHistory,"watch history fetched successfully")
  )
})

export {
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
  getWatchHistory
};
