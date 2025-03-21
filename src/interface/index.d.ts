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
  }[];
}

interface TokenInterface {
  access?: string;
  refresh?: string;
}

interface FriendInterface extends Document {
  _id?: Types.ObjectId;
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "canceled" | "blocked";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ConversationInterface extends Document {
  _id?: Types.ObjectId;
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  interaction: Date;
}

interface MessageInterface extends Document {
  _id?: Types.ObjectId;
  sender: Types.ObjectId;
  recipient: Types.ObjectId;
  type: "default" | "edited" | "deleted";
  content: {
    type: "text" | "file";
    text?: string;
    file?: string;
  };
  deletedAt: Date;
}

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
    uid: Types.ObjectId;
    time?: Date;
  }[];
  comments: {
    _id?: Types.ObjectId;
    uid: Types.ObjectId;
    text: string;
    time?: Date;
  }[];
  mentioned: {
    _id?: Types.ObjectId;
    uid: Types.ObjectId;
    time?: Date;
  }[];
  user: Types.ObjectId;
}
