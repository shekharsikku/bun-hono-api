import { Document, Types } from "mongoose";

interface UserInterface extends Document {
  _id?: Types.ObjectId;
  name?: string;
  email: string;
  username?: string;
  password?: string;
  gender?: "Male" | "Female" | "Other";
  image?: string;
  bio?: string;
  setup?: boolean;
  verified?: boolean;
  status?: "active" | "inactive";
  lastLoginAt?: Date;
  verification?: {
    code: string;
    expiry: Date;
    attempts?: number;
  };
  reset?: {
    code: string;
    expiry: Date;
    attempts?: number;
  };
  authentication?: {
    _id?: Types.ObjectId;
    token: string;
    expiry: Date;
    device?: string;
    lastUsedAt?: Date;
    ipAddress?: string;
  }[];
}

interface TokenInterface {
  access?: string;
  refresh?: string;
}

interface FriendInterface extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "canceled" | "blocked";
}

/** feed interface */
interface FeedInterface extends Document {
  _id?: Types.ObjectId;
  title: string;
  type: "content" | "media";
  content?: string;
  media?: string;
  tags: string[];
  location?: string;
  likes: {
    _id?: Types.ObjectId;
    uid: Types.ObjectId; // User who liked
    time?: Date;
  }[];
  comments: {
    _id?: Types.ObjectId;
    uid: Types.ObjectId; // User who commented
    text: string;
    time?: Date;
  }[];
  mentioned: {
    _id?: Types.ObjectId;
    uid: Types.ObjectId; // User who is mentioned
    time?: Date;
  }[];
  user: Types.ObjectId; // Feed creator/owner
}
