import { Types, Schema, model } from "mongoose";
import type { UserInterface } from "../interface";

const UserSchema = new Schema<UserInterface>(
  {
    name: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      sparse: true,
      default: null,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    setup: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    verification: {
      _id: false,
      code: String,
      expiry: Date,
      attempts: Number,
    },
    reset: {
      _id: false,
      code: String,
      expiry: Date,
      attempts: Number,
    },
    authentication: {
      type: [
        {
          token: String,
          expiry: Date,
          device: {
            type: String,
            default: null,
          },
          lastUsedAt: {
            type: Date,
            default: Date.now,
          },
          ipAddress: {
            type: String,
            default: null,
          },
        },
      ],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function (next) {
  if (!this.username || this.username.trim() === "") {
    this.username = new Types.ObjectId().toString();
  }
  next();
});

const User = model<UserInterface>("User", UserSchema);

export default User;
