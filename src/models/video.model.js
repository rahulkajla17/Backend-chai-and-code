import mongoose, { mongo, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videofile: {
      type: string,
      required: true,
    },
    thumbnail: {
      type: string,
      required: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: string,
      required: true,
    },
    description: {
      type: string,
      required: true,
    },
    duration: {
      type: string,
      required: true,
    },
    views: {
      type: number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
    },
  },
  { timestamps: true },
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
