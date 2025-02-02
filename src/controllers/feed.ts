import type { Context } from "hono";
import { ApiError, ApiResponse } from "../utils";
import Feed from "../models/feed";

const newFeed = async (c: Context) => {
  try {
    const { title, type, content, media, tags, location } = await c.req.json();

    const uid = c.get("requestUser")._id;

    const feed = await Feed.create({
      title,
      type,
      content: type === "content" ? content : undefined,
      media: type === "media" ? media : undefined,
      tags,
      location,
      user: uid,
    });

    return ApiResponse(c, 201, "Feed posted successfully!", feed);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const editFeed = async (c: Context) => {
  try {
    const { title, type, content, media } = await c.req.json();

    const fid = c.req.param("fid");
    const uid = c.get("requestUser")._id;

    const updatedFeed = await Feed.findOneAndUpdate(
      {
        _id: fid,
        user: uid,
      },
      { title, type, content, media },
      { new: true }
    );

    if (!updatedFeed) {
      throw new ApiError(
        403,
        "Feed not found or you are not authorized to update this feed!"
      );
    }

    return ApiResponse(c, 200, "Feed updated successfully!", updatedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const deleteFeed = async (c: Context) => {
  try {
    const fid = c.req.param("fid");
    const uid = c.get("requestUser")._id;

    const deletedFeed = await Feed.findOneAndDelete({
      _id: fid,
      user: uid,
    });

    if (!deletedFeed) {
      throw new ApiError(
        403,
        "Feed not found or you are not authorized to delete this feed!"
      );
    }

    return ApiResponse(c, 200, "Feed deleted successfully!", deletedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const likeFeed = async (c: Context) => {
  try {
    const fid = c.req.param("fid");
    const uid = c.get("requestUser")._id;

    const feed = await Feed.findById(fid);

    if (!feed) {
      throw new ApiError(404, "Feed not found!");
    }

    const existingLike = feed.likes.find(
      (like) => like.uid.toString() === uid.toString()
    );

    if (existingLike) {
      feed.likes = feed.likes.filter(
        (like) => like.uid.toString() !== uid.toString()
      );
      await feed.save();
      return ApiResponse(c, 200, "Feed unliked successfully!", feed);
    } else {
      feed.likes.push({ uid, time: new Date() });
      await feed.save();
      return ApiResponse(c, 200, "Feed liked successfully!", feed);
    }
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const addComment = async (c: Context) => {
  try {
    const { comment } = await c.req.json();

    const fid = c.req.param("fid");
    const uid = c.get("requestUser")._id;

    const commented = await Feed.findByIdAndUpdate(
      fid,
      {
        $push: {
          comments: {
            uid: uid,
            text: comment,
            time: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!commented) {
      throw new ApiError(404, "Feed not found!");
    }

    return ApiResponse(c, 200, "Comment added successfully!", commented);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const editComment = async (c: Context) => {
  try {
    const { comment } = await c.req.json();
    const { fid, cid } = c.req.param();

    const uid = c.get("requestUser")._id;

    const updatedFeed = await Feed.findOneAndUpdate(
      {
        _id: fid,
        comments: {
          $elemMatch: { _id: cid, uid: uid },
        },
      },
      {
        $set: { "comments.$.text": comment },
      },
      { new: true }
    );

    if (!updatedFeed) {
      throw new ApiError(
        403,
        "Comment not found or you are not authorized to edit it!"
      );
    }

    return ApiResponse(c, 200, "Comment edited successfully!", updatedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const removeComment = async (c: Context) => {
  try {
    const { fid, cid } = c.req.param();

    const uid = c.get("requestUser")._id;

    const updatedFeed = await Feed.findOneAndUpdate(
      {
        _id: fid,
        comments: {
          $elemMatch: { _id: cid, uid: uid },
        },
      },
      { $pull: { comments: { _id: cid, uid: uid } } },
      { new: true }
    );

    if (!updatedFeed) {
      throw new ApiError(
        403,
        "Comment not found or you are not authorized to remove it!"
      );
    }

    return ApiResponse(c, 200, "Comment removed successfully!", updatedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const getFeedById = async (c: Context) => {
  try {
    const fid = c.req.param("fid");

    const feed = await Feed.findById(fid);

    if (!feed) {
      throw new ApiError(404, "Feed not found!");
    }

    return ApiResponse(c, 200, "Feed fetched successfully!", feed);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const getFilteredFeeds = async (c: Context) => {
  try {
    const order = c.req.query("order"); // `order` query parameter can be 'newest' or 'oldest';

    let sortOrder = {};

    if (order === "newest") {
      sortOrder = { createdAt: -1 };
    } else if (order === "oldest") {
      sortOrder = { createdAt: 1 };
    } else {
      sortOrder = { createdAt: -1 };
    }

    const feeds = await Feed.find().sort(sortOrder);

    if (feeds.length === 0) {
      return ApiResponse(c, 404, "No feeds found!");
    }

    return ApiResponse(c, 200, "Feeds fetched successfully!", feeds);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

const getUserFeeds = async (c: Context) => {
  try {
    const uid = c.get("requestUser")._id;

    const feeds = await Feed.find({ user: uid }).sort({ createdAt: -1 });

    if (feeds.length === 0) {
      return ApiResponse(c, 404, "No feeds found for the current user!");
    }

    return ApiResponse(c, 200, "Feeds retrieved successfully!", feeds);
  } catch (error: any) {
    return ApiResponse(c, error.code || 400, error.message);
  }
};

export {
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
};
