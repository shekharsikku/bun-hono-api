import { Schema, model } from "mongoose";
import type { FeedInterface } from "@/interface";

const LikeSchema = new Schema({
  uid: { type: Schema.Types.ObjectId, ref: "User", required: true },
  time: { type: Date, default: Date.now },
});

const MentionedSchema = new Schema({
  uid: { type: Schema.Types.ObjectId, ref: "User", required: true },
  time: { type: Date, default: Date.now },
});

const CommentSchema = new Schema({
  uid: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

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
      validate: [(val: string[]) => val.length <= 10, "Too many tags!"],
    },
    location: {
      type: String,
      maxlength: 100,
      default: null,
    },
    likes: {
      type: [LikeSchema],
      default: [],
    },
    comments: {
      type: [CommentSchema],
      default: [],
    },
    mentioned: {
      type: [MentionedSchema],
      default: [],
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

FeedSchema.index({ user: 1 });
FeedSchema.index({ type: 1 });
FeedSchema.index({ mentioned: 1 });

FeedSchema.pre("validate", function (next) {
  if (!this.title || !this.type) {
    return next(new Error("Title and type of feed is required!"));
  }
  if (this.type === "content" && !this.content) {
    return next(new Error("Content is required when type is 'content'!"));
  }
  if (this.type === "media" && !this.media) {
    return next(new Error("Media is required when type is 'media'!"));
  }
  next();
});

const Feed = model<FeedInterface>("Feed", FeedSchema);

export default Feed;
