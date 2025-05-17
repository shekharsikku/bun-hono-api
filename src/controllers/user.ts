import type { Context } from "hono";
import { Types } from "mongoose";
import { hash, verify } from "argon2";
import { ApiError, ApiResponse } from "~/utils";
import { imagekitUpload, imagekitDelete } from "~/utils/imagekit";
import { setData } from "~/utils/redis";
import {
  generateAccess,
  hasEmptyField,
  createUserInfo,
  argonOptions,
} from "~/utils/helpers";
import User from "~/models/user";
import Conversation from "~/models/conversation";

const profileSetup = async (ctx: Context) => {
  try {
    const { name, username, gender, bio } = ctx.get("validated");
    const requestUser = ctx.req.user;

    if (username !== requestUser?.username) {
      const existsUsername = await User.exists({ username });

      if (existsUsername) {
        throw new ApiError(409, "Username already exists!");
      }
    }

    const userDetails = { name, username, gender, bio, setup: false };
    const isCompleted = !hasEmptyField({ name, username, gender });

    if (isCompleted) {
      userDetails.setup = true;
    }

    const updatedProfile = await User.findByIdAndUpdate(
      requestUser?._id,
      userDetails,
      { new: true }
    );

    if (!updatedProfile) {
      throw new ApiError(400, "Profile setup not completed!");
    }

    const userInfo = createUserInfo(updatedProfile);

    if (!userInfo.setup) {
      return ApiResponse(ctx, 200, "Please, complete your profile!", userInfo);
    }

    await generateAccess(ctx, userInfo._id!);
    await setData(userInfo);

    return ApiResponse(ctx, 200, "Profile updated successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const updateImage = async (ctx: Context) => {
  try {
    const requestUser = ctx.req.user;

    const dataBody = await ctx.req.parseBody();
    const imageFile = dataBody.image;

    if (!imageFile || !(imageFile instanceof File)) {
      throw new ApiError(400, "Invalid image file upload!");
    }

    const userProfile = await User.findById(requestUser?._id);

    if (userProfile) {
      if (userProfile.image && userProfile.image !== "") {
        const imageUrl = new URL(userProfile.image);
        const fileId = imageUrl.searchParams.get("fid");
        fileId && (await imagekitDelete(fileId));
      }

      const uploadedImage = await imagekitUpload(imageFile);

      if (uploadedImage && uploadedImage.url) {
        userProfile.image = `${uploadedImage.url}?fid=${uploadedImage.fileId}`;
        await userProfile.save({ validateBeforeSave: true });

        const userInfo = createUserInfo(userProfile);
        await generateAccess(ctx, userInfo._id!);
        await setData(userInfo);

        return ApiResponse(
          ctx,
          200,
          "Profile image updated successfully!",
          userInfo
        );
      }
    }
    throw new ApiError(500, "Profile image not updated!");
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const deleteImage = async (ctx: Context) => {
  try {
    const requestUser = ctx.req.user;

    if (requestUser && requestUser?.image !== "") {
      const imageData = JSON.parse(requestUser.image!);
      await imagekitDelete(imageData.fid);

      const updatedProfile = await User.findByIdAndUpdate(
        requestUser?._id,
        { image: "" },
        { new: true }
      );

      if (!updatedProfile) {
        throw new ApiError(400, "Error while deleting image!");
      }

      const userInfo = createUserInfo(updatedProfile);
      await generateAccess(ctx, userInfo._id!);
      await setData(userInfo);

      return ApiResponse(
        ctx,
        200,
        "Profile image deleted successfully!",
        userInfo
      );
    }
    throw new ApiError(400, "Profile image not available!");
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const changePassword = async (ctx: Context) => {
  try {
    const { old_password, new_password } = ctx.get("validated");

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const userId = ctx.req.user?._id;

    const requestUser = await User.findById(userId).select("+password");

    if (!requestUser) {
      throw new ApiError(403, "Invalid authorization!");
    }

    const isCorrect = await verify(requestUser.password!, old_password);

    if (!isCorrect) {
      throw new ApiError(403, "Incorrect old password!");
    }

    requestUser.password = await hash(new_password, argonOptions);
    await requestUser.save({ validateBeforeSave: true });

    const userInfo = createUserInfo(requestUser);
    await generateAccess(ctx, userInfo._id!);
    await setData(userInfo);

    return ApiResponse(ctx, 200, "Password changed successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const userInformation = async (ctx: Context) => {
  try {
    const requestUser = ctx.req.user;

    let message = requestUser?.setup
      ? "User profile information!"
      : "Please, complete your profile!";

    return ApiResponse(ctx, 200, message, requestUser);
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const searchUsers = async (ctx: Context) => {
  try {
    const search = ctx.req.query("search");

    if (!search) {
      throw new ApiError(400, "Search query is required!");
    }

    const terms = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(terms, "i");

    const result = await User.find({
      $and: [
        { _id: { $ne: ctx.req.user?._id } },
        { setup: true },
        { $or: [{ name: regex }, { username: regex }, { email: regex }] },
      ],
    }).lean();

    if (result.length == 0) {
      throw new ApiError(404, "No any user found!");
    }

    return ApiResponse(ctx, 200, "Available contacts!", result);
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const fetchContacts = async (ctx: Context) => {
  try {
    const uid = new Types.ObjectId(ctx.req.user?._id);

    const conversations = await Conversation.find({
      participants: uid,
    })
      .sort({ interaction: -1 })
      .populate("participants", "name email username gender image bio")
      .lean();

    const contacts = conversations
      .map((conversation) => {
        const contact = conversation.participants.find(
          (participant: any) => !participant._id.equals(uid)
        );

        return contact
          ? { ...contact, interaction: conversation.interaction }
          : null;
      })
      .filter(Boolean);

    return ApiResponse(ctx, 200, "Contacts fetched successfully!", contacts);
  } catch (error: any) {
    return ApiResponse(ctx, 500, "An error occurred while fetching contacts!");
  }
};

export {
  profileSetup,
  updateImage,
  deleteImage,
  changePassword,
  userInformation,
  searchUsers,
  fetchContacts,
};
