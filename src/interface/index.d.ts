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
  authentication?: {
    _id?: Types.ObjectId;
    token: string;
    expiry: Date;
    device?: string;
  }[];
}

interface TokenInterface {
  access?: string;
  refresh?: string;
}

interface DetailInterface {
  name?: string;
  username?: string;
  gender?: "Male" | "Female";
  bio?: string;
  setup?: boolean;
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
