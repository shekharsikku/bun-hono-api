import type { Context } from "hono";
import { ApiError, ApiResponse } from "../utils";
import Feed from "../models/feed";

const newFeed = async (c: Context) => {
  try {
    const { title, type, content, media } = await c.req.json();
    const uid = c.req.user?._id;

    const feed = await Feed.create({
      title,
      type,
      content,
      media,
      user: uid,
    });

    return ApiResponse(c, 201, "Feed posted successfully!", feed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const editFeed = async (c: Context) => {
  try {
    const { title, type, content, media } = await c.req.json();

    const fid = c.req.param("fid");
    const uid = c.req.user?._id!;

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
        404,
        "Feed not found or you are not authorized to update this feed!"
      );
    }

    return ApiResponse(c, 200, "Feed updated successfully!", updatedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const deleteFeed = async (c: Context) => {
  try {
    const fid = c.req.param("fid");
    const uid = c.req.user?._id!;

    const deletedFeed = await Feed.findOneAndDelete({
      _id: fid,
      user: uid,
    });

    if (!deletedFeed) {
      throw new ApiError(
        404,
        "Feed not found or you are not authorized to delete this feed!"
      );
    }

    return ApiResponse(c, 200, "Feed deleted successfully!", deletedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const likeFeed = async (c: Context) => {
  try {
    const fid = c.req.param("fid");
    const uid = c.req.user?._id!;

    const updatedFeed = await Feed.findByIdAndUpdate(
      fid,
      [
        {
          $set: {
            likes: {
              $cond: {
                if: { $in: [uid, "$likes"] },
                then: { $setDifference: ["$likes", [uid]] },
                else: { $concatArrays: ["$likes", [uid]] },
              },
            },
          },
        },
      ],
      { new: true }
    );

    if (!updatedFeed) {
      throw new ApiError(404, "Feed not found!");
    }

    const action = updatedFeed.likes.includes(uid)
      ? "Feed liked successfully!"
      : "Feed unlike successfully!";

    return ApiResponse(c, 200, action, updatedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const addComment = async (c: Context) => {
  try {
    const fid = c.req.param("fid");
    const uid = c.req.user?._id!;
    const { comment } = await c.req.json();

    const commentedFeed = await Feed.findByIdAndUpdate(
      fid,
      {
        $push: {
          comments: {
            uid: uid,
            text: comment,
          },
        },
      },
      { new: true }
    );

    if (!commentedFeed) {
      throw new ApiError(404, "Feed not found!");
    }

    return ApiResponse(c, 200, "Comment added successfully!", commentedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const editComment = async (c: Context) => {
  try {
    const { fid, cid } = c.req.param();
    const { comment } = await c.req.json();
    const uid = c.req.user?._id;

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
        404,
        "Comment not found or you are not authorized to edit it."
      );
    }

    return ApiResponse(c, 200, "Comment edited successfully!", updatedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const removeComment = async (c: Context) => {
  try {
    const { fid, cid } = c.req.param();
    const uid = c.req.user?._id;

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
        404,
        "Comment not found or you are not authorized to remove it."
      );
    }

    return ApiResponse(c, 200, "Comment removed successfully!", updatedFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const getFeedById = async (c: Context) => {
  try {
    const fid = c.req.param("fid");

    const currentFeed = await Feed.findById(fid);

    if (!currentFeed) {
      throw new ApiError(404, "Feed not found!");
    }

    return ApiResponse(c, 200, "Feed fetched successfully!", currentFeed);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const getAllFeeds = async (c: Context) => {
  try {
    const filter = c.req.query("filter");

    let allFeeds = [];

    if (filter && filter === "newest") {
      allFeeds = await Feed.find().sort({ createdAt: -1 });
    } else if (filter && filter === "oldest") {
      allFeeds = await Feed.find().sort({ createdAt: 1 });
    } else {
      allFeeds = await Feed.find();
    }

    if (allFeeds.length <= 0) {
      throw new ApiError(404, "No any feed available!");
    }

    return ApiResponse(c, 200, "Feeds fetched successfully!", allFeeds);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

// const getFeedByFilter = async (c: Context) => {
//   try {
//     const brand = c.req.query("brand");
//     const category = c.req.query("category");
//     return ApiResponse(c, 400, "Please, query you filter!");
//   } catch (error: any) {
//     return ApiResponse(c, error.code, error.message);
//   }
// };

export {
  newFeed,
  editFeed,
  deleteFeed,
  likeFeed,
  addComment,
  editComment,
  removeComment,
  getFeedById,
  getAllFeeds,
};
