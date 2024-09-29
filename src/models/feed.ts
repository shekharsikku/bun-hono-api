import { Schema, model } from "mongoose";
import type { FeedInterface } from "../interface";

const FeedSchema = new Schema<FeedInterface>(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["content", "media"],
      required: true,
    },
    content: {
      type: String,
      required: function (this: FeedInterface) {
        return this.type === "content";
      },
    },
    media: {
      type: String,
      required: function (this: FeedInterface) {
        return this.type === "media";
      },
    },
    tags: {
      type: [String],
    },
    location: {
      type: String,
    },
    likes: {
      type: [Schema.Types.ObjectId],
    },
    comments: {
      type: [
        {
          uid: Schema.Types.ObjectId,
          text: String,
          time: { type: Date, default: Date.now },
        },
      ],
    },
    mentioned: {
      type: [Schema.Types.ObjectId],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Feed = model<FeedInterface>("Feed", FeedSchema);

export default Feed;
