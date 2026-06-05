import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadonCloudinary = async (avatarlocalPath) => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET, // Click 'View API Keys' above to copy your API secret
    });

    if (!avatarlocalPath) return null;
    console.log("uploading file : ", avatarlocalPath);
    const response = await cloudinary.uploader.upload(avatarlocalPath, {
      resource_type: "auto",
    });
    console.log("file is succelfully uploaded", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(avatarlocalPath);
    console.log("Cloudinary Error", error);
    return null;
  }
};

export { uploadonCloudinary };
