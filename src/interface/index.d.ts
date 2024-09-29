import { Document, Types } from "mongoose";

interface UserInterface extends Document {
  _id?: Types.ObjectId;
  name?: string;
  email: string;
  username?: string;
  password?: string;
  gender?: "Male" | "Female";
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
  likes: Types.ObjectId[];
  comments: {
    _id?: Types.ObjectId;
    uid: Types.ObjectId;
    text: string;
    time?: Date;
  }[];
  mentioned: Types.ObjectId[];
  user: Types.ObjectId;
}
