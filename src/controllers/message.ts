import type { Context } from "hono";
import { ApiError, ApiResponse } from "@/utils";
import Conversation from "@/models/conversation";
import Message from "@/models/message";

const sendMessage = async (ctx: Context) => {
  try {
    const sender = ctx.req.user?._id;
    const receiver = ctx.req.param("id");
    const { type, text, file } = ctx.get("validated");

    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [sender, receiver],
      });
    }

    const message = new Message({
      sender: sender,
      recipient: receiver,
      content: {
        type: type,
        text: text,
        file: file,
      },
    });

    if (message) {
      conversation.messages.push(message._id);
      conversation.interaction = new Date(Date.now());
    }

    await Promise.all([conversation.save(), message.save()]);

    /** Handle socket event for realtime messaging */

    return ApiResponse(ctx, 201, "Message sent successfully!", message);
  } catch (error: any) {
    console.error("Error:", error.message);
    return ApiResponse(ctx, 500, "Error while sending message!");
  }
};

const getMessages = async (ctx: Context) => {
  try {
    const sender = ctx.req.user?._id;
    const receiver = ctx.req.param("id");

    const messages = await Message.find({
      $or: [
        { sender: sender, recipient: receiver },
        { sender: receiver, recipient: sender },
      ],
    }).distinct("_id");

    const conversation = await Conversation.findOneAndUpdate(
      {
        participants: { $all: [sender, receiver] },
      },
      [
        {
          $set: {
            messages: {
              $filter: {
                input: "$messages",
                as: "message",
                cond: { $in: ["$$message", messages] },
              },
            },
          },
        },
      ],
      { new: true }
    )
      .populate("messages")
      .lean();

    if (!conversation) {
      return ApiResponse(ctx, 200, "No any message available!", []);
    }

    return ApiResponse(
      ctx,
      200,
      "Messages fetched successfully!",
      conversation?.messages
    );
  } catch (error: any) {
    return ApiResponse(ctx, 500, "Error while fetching messages!");
  }
};

const editMessage = async (ctx: Context) => {
  try {
    const userId = ctx.req.user?._id;
    const msgId = ctx.req.param("id");
    const { text } = await ctx.req.json();

    if (!text) {
      throw new ApiError(400, "Text content is required for editing!");
    }

    const message = await Message.findOneAndUpdate(
      { _id: msgId, sender: userId, "content.type": "text" },
      {
        type: "edited",
        "content.text": text,
      },
      { new: true }
    );

    if (!message) {
      throw new ApiError(
        403,
        "You can't edit this message or message not found!"
      );
    }

    return ApiResponse(ctx, 200, "Message edited successfully!", message);
  } catch (error: any) {
    return ApiResponse(
      ctx,
      error.code || 500,
      error.message || "Error while editing message!"
    );
  }
};

const deleteMessage = async (ctx: Context) => {
  try {
    const userId = ctx.req.user?._id;
    const msgId = ctx.req.param("id");

    const message = await Message.findOneAndUpdate(
      { _id: msgId, sender: userId },
      {
        type: "deleted",
        deletedAt: new Date(),
        $unset: { content: 1 },
      },
      { new: true }
    );

    if (!message) {
      throw new ApiError(
        403,
        "You can't delete this message or message not found!"
      );
    }

    return ApiResponse(ctx, 200, "Message deleted successfully!", message);
  } catch (error: any) {
    return ApiResponse(
      ctx,
      error.code || 500,
      error.message || "Error while deleting message!"
    );
  }
};

const deleteMessages = async (ctx: Context) => {
  try {
    const userId = ctx.req.user?._id;

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);

    const result = await Message.deleteMany({
      $or: [{ sender: userId }, { recipient: userId }],
      createdAt: { $lt: hoursAgo },
    });

    return ApiResponse(ctx, 200, "Older messages deleted!", result);
  } catch (error: any) {
    return ApiResponse(ctx, 500, "Error while deleting messages!");
  }
};

export { sendMessage, getMessages, editMessage, deleteMessage, deleteMessages };
