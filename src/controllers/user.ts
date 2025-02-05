import type { Context } from "hono";
import { hash, verify } from "argon2";
import { ApiError, ApiResponse } from "../utils";
import { imagekitUpload, imagekitDelete } from "../utils/imagekit";
import {
  generateAccess,
  hasEmptyField,
  createUserInfo,
  argonOptions,
} from "../helpers";
import User from "../models/user";

const profileSetup = async (c: Context) => {
  try {
    const { name, username, gender, bio } = c.get("validData");
    const requestUser = c.get("requestUser");

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
      return ApiResponse(c, 200, "Please, complete your profile!", userInfo);
    }

    await generateAccess(c, userInfo);

    return ApiResponse(c, 200, "Profile updated successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const updateImage = async (c: Context) => {
  try {
    const requestUser = c.get("requestUser");

    const dataBody = await c.req.parseBody();
    const imageFile = dataBody.image;

    if (!imageFile || !(imageFile instanceof File)) {
      throw new ApiError(400, "Invalid image file upload!");
    }

    const userProfile = await User.findById(requestUser?._id);

    if (userProfile) {
      if (userProfile.image !== "") {
        const imageData = JSON.parse(userProfile.image!);
        await imagekitDelete(imageData.fid);
      }

      const uploadedImage = await imagekitUpload(imageFile);

      if (uploadedImage && uploadedImage.url) {
        userProfile.image = JSON.stringify({
          fid: uploadedImage.fileId,
          url: uploadedImage.url,
        });
        await userProfile.save({ validateBeforeSave: true });

        const userInfo = createUserInfo(userProfile);
        await generateAccess(c, userInfo);

        return ApiResponse(
          c,
          200,
          "Profile image updated successfully!",
          userInfo
        );
      }
    }
    throw new ApiError(500, "Profile image not updated!");
  } catch (error: any) {
    console.error(error);
    return ApiResponse(c, error.code, error.message);
  }
};

const deleteImage = async (c: Context) => {
  try {
    const requestUser = c.get("requestUser");

    if (requestUser && requestUser.image !== "") {
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
      await generateAccess(c, userInfo);

      return ApiResponse(
        c,
        200,
        "Profile image deleted successfully!",
        userInfo
      );
    }
    throw new ApiError(400, "Profile image not available!");
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const changePassword = async (c: Context) => {
  try {
    const { old_password, new_password } = c.get("validData");

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const userId = c.get("requestUser")._id;

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
    await generateAccess(c, userInfo);

    return ApiResponse(c, 202, "Password changed successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const userInformation = async (c: Context) => {
  try {
    const requestUser = c.get("requestUser");

    let message = requestUser?.setup
      ? "User profile information!"
      : "Please, complete your profile!";

    return ApiResponse(c, 200, message, requestUser);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

export {
  profileSetup,
  updateImage,
  deleteImage,
  changePassword,
  userInformation,
};
