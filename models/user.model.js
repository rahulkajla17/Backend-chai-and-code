import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    username: {
      type: string,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: string,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullname: {
      type: string,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: string,
      required: [true, "Password is requried"],
    },
    watchhistory: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    avatar: {
      type: string,
    },
    coverimage: {
      type: string,
      required: true,
    },
    refreshtoken: {
      type: string,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = bcrypt.hash(this.password, 10);
    next();
  }
});

//custom method

userSchema.methods.isPasswrodcorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIN: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

userSchema.methods.generaterefreshToken = function () {
  return jwt.sign(
    {
      id: this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIN: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const User = mongoose.model("User", userSchema);
