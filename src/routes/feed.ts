import { Hono } from "hono";
import { authAccess } from "../middlewares";
import {
  newFeed,
  editFeed,
  deleteFeed,
  likeFeed,
  addComment,
  editComment,
  removeComment,
  getFeedById,
  getAllFeeds,
} from "../controllers/feed";

const feed = new Hono().basePath("/api/feed");

feed.post("/new", authAccess, newFeed);

feed.delete("/delete/:fid", authAccess, deleteFeed);

feed.patch("/edit/:fid", authAccess, editFeed);
feed.patch("/like/:fid", authAccess, likeFeed);
feed.patch("/comment/:fid", authAccess, addComment);

feed.patch("/comment/:fid/edit/:cid", authAccess, editComment);
feed.patch("/comment/:fid/remove/:cid", authAccess, removeComment);

feed.get("/get/:fid", getFeedById);
feed.get("/getall", getAllFeeds);

export default feed;
