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
  getFilteredFeeds,
  getUserFeeds,
} from "../controllers/feed";

const feed = new Hono().basePath("/api/feed");

feed.post("/new", authAccess, newFeed);

feed.delete("/delete/:fid", authAccess, deleteFeed);

feed.patch("/edit/:fid", authAccess, editFeed);
feed.patch("/like/:fid", authAccess, likeFeed);
feed.patch("/comment/:fid", authAccess, addComment);

feed.patch("/comment/:fid/edit/:cid", authAccess, editComment);
feed.patch("/comment/:fid/remove/:cid", authAccess, removeComment);

feed.get("/get-user-feeds", authAccess, getUserFeeds);
feed.get("/get-filter-feeds", getFilteredFeeds);
feed.get("/get-feed/:fid", getFeedById);

export default feed;
