import type { Context } from "hono";
import { Types } from "mongoose";
import { ApiError, ApiResponse } from "@/utils";
import Friend from "@/models/friend";
import User from "@/models/user";

const sendRequest = async (ctx: Context) => {
  try {
    const requester = ctx.req.user?._id;
    const recipient = ctx.req.query("to");

    if (!recipient) {
      throw new ApiError(400, "Recipient required for send request!");
    }

    if (requester?.toString() === recipient) {
      throw new ApiError(400, "You cannot send a request to yourself!");
    }

    const recipientExists = await User.exists({ _id: recipient });

    if (!recipientExists) {
      throw new ApiError(404, "Recipient does not exist!");
    }

    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requester, recipient: recipient },
        { requester: recipient, recipient: requester },
      ],
      status: {
        $in: ["pending", "accepted", "rejected", "canceled", "blocked"],
      },
    });

    if (existingRequest) {
      const cooldownTime = 7 * 24 * 60 * 60 * 1000;
      const createdAtTime =
        Date.now() - new Date(existingRequest.createdAt!).getTime();

      if (existingRequest.status === "pending") {
        throw new ApiError(400, "Friend request already sent!");
      }

      if (existingRequest.status === "accepted") {
        throw new ApiError(400, "You both are already friends!");
      }

      if (["rejected", "canceled"].includes(existingRequest.status)) {
        if (createdAtTime < cooldownTime) {
          const remainingDays = Math.ceil(
            (cooldownTime - createdAtTime) / (1000 * 60 * 60 * 24)
          );
          throw new ApiError(
            400,
            `You can send a new request after ${remainingDays} days!`
          );
        }
      }

      if (existingRequest.status === "blocked") {
        throw new ApiError(
          400,
          "You cannot send a request. User has blocked you!"
        );
      }
    }

    await Friend.create({ requester, recipient });

    /** handle a request notification here in via socket.io */

    return ApiResponse(ctx, 200, "Friend request sent successfully!");
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const handleRequest = async (ctx: Context) => {
  try {
    const recipient = ctx.req.user?._id;
    const requester = ctx.req.query("from");
    const action = ctx.req.query("action");

    if (!requester) {
      throw new ApiError(400, "Requester required for handle request!");
    }

    if (!action || !["accept", "reject"].includes(action)) {
      throw new ApiError(400, "Action must be either 'accept' or 'reject'!");
    }

    const updatedResult = await Friend.updateOne(
      { requester, recipient, status: "pending" },
      { $set: { status: action === "accept" ? "accepted" : "rejected" } }
    );

    if (updatedResult.matchedCount === 0) {
      throw new ApiError(404, "Friend request not found or already processed!");
    }

    return ApiResponse(ctx, 200, `Friend request ${action}ed successfully!`);
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const retrieveRequest = async (ctx: Context) => {
  try {
    const requester = ctx.req.user?._id;
    const recipient = ctx.req.query("from");

    const cancelResponse = await Friend.updateOne(
      { requester, recipient, status: "pending" },
      { $set: { status: "canceled" } }
    );

    if (cancelResponse.modifiedCount > 0) {
      return ApiResponse(ctx, 200, "Friend request cancelled!");
    }

    throw new ApiError(400, "No pending request found to cancel!");
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const pendingRequests = async (ctx: Context) => {
  try {
    const uid = new Types.ObjectId(ctx.req.user?._id);

    const pipeline = [
      {
        $match: {
          $or: [
            { requester: uid, status: "pending" },
            { recipient: uid, status: "pending" },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "requester",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                email: 1,
                image: 1,
                bio: 1,
                gender: 1,
              },
            },
          ],
          as: "requesterDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "recipient",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                username: 1,
                email: 1,
                image: 1,
                bio: 1,
                gender: 1,
              },
            },
          ],
          as: "recipientDetails",
        },
      },
      {
        $project: {
          _id: 0,
          requester: 1,
          recipient: 1,
          requesterDetails: {
            $arrayElemAt: ["$requesterDetails", 0],
          },
          recipientDetails: {
            $arrayElemAt: ["$recipientDetails", 0],
          },
          at: "$createdAt",
        },
      },
      {
        $facet: {
          sent: [
            {
              $match: { requester: uid },
            },
            {
              $project: {
                at: 1,
                user: "$recipientDetails",
              },
            },
          ],
          received: [
            {
              $match: { recipient: uid },
            },
            {
              $project: {
                at: 1,
                user: "$requesterDetails",
              },
            },
          ],
        },
      },
    ];

    const [result] = await Friend.aggregate(pipeline);

    return ApiResponse(ctx, 200, "Pending request fetched!", {
      sent: result?.sent || [],
      received: result?.received || [],
    });
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const unfriendUser = async (ctx: Context) => {
  try {
    const uid = ctx.req.user?._id;
    const fid = ctx.req.query("friend");

    if (!fid) {
      throw new ApiError(400, "Friend id is required!");
    }

    const unfriendResult = await Friend.deleteOne({
      status: "accepted",
      $or: [
        { requester: uid, recipient: fid },
        { requester: fid, recipient: uid },
      ],
    });

    if (unfriendResult.deletedCount > 0) {
      return ApiResponse(ctx, 200, "Friend removed successfully!");
    }

    return ApiResponse(ctx, 400, "No matching friendship found!");
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const fetchFriends = async (ctx: Context) => {
  try {
    const userId = new Types.ObjectId(ctx.req.user?._id);

    const friends = await Friend.aggregate([
      {
        $match: {
          status: "accepted",
          $or: [{ requester: userId }, { recipient: userId }],
        },
      },
      {
        $addFields: {
          friendId: {
            $cond: {
              if: { $eq: ["$requester", userId] },
              then: "$recipient",
              else: "$requester",
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "friendId",
          foreignField: "_id",
          as: "friendData",
        },
      },
      { $unwind: { path: "$friendData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          friendFrom: "$updatedAt",
          friendId: "$friendData._id",
          name: "$friendData.name",
          email: "$friendData.email",
          username: "$friendData.username",
          image: "$friendData.image",
          bio: "$friendData.bio",
          gender: "$friendData.gender",
        },
      },
    ]);

    if (!friends.length) {
      throw new ApiError(404, "No any friends found!");
    }

    return ApiResponse(ctx, 200, "Friends fetched successfully!", friends);
  } catch (error: any) {
    return ApiResponse(ctx, error.code || 500, error.message);
  }
};

export {
  sendRequest,
  handleRequest,
  retrieveRequest,
  pendingRequests,
  unfriendUser,
  fetchFriends,
};
