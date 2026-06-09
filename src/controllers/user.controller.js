import { asynchandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { apiresponse } from "../utils/ApiResponse.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";
import { access } from "node:fs";
import { error } from "node:console";

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
      $set: {
        refreshtoken: undefined,
      },
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
export { registerUser, loginuser, logoutuser };
