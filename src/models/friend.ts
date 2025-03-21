import type { FriendInterface } from "@/interface";
import { Schema, model } from "mongoose";

const FriendSchema = new Schema<FriendInterface>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "canceled", "blocked"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendSchema.index({ recipient: 1, requester: 1 });
FriendSchema.index({ status: 1 });

FriendSchema.pre("save", function (next) {
  if (this.requester.equals(this.recipient)) {
    return next(new Error("Requester and recipient must be different users!"));
  }
  next();
});

const Friend = model<FriendInterface>("Friend", FriendSchema);

export default Friend;
