import type { Context } from "hono";
import { genSalt, hash, compare } from "bcryptjs";
import { ApiError, ApiResponse } from "../utils";
import { generateAccess, hasEmptyField, createUserInfo } from "../helpers";
import User from "../models/user";

const profileSetup = async (c: Context) => {
  try {
    const { name, username, gender, bio } = c.get("validData");
    const requestUser = c.req.user;

    if (username !== requestUser?.username) {
      const existsUsername = await User.findOne({ username });

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

const changePassword = async (c: Context) => {
  try {
    const { old_password, new_password } = c.get("validData");

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const requestUser = await User.findById(c.req.user?._id).select(
      "+password"
    );

    if (!requestUser) {
      throw new ApiError(403, "Invalid authorization!");
    }

    const isCorrect = await compare(old_password, requestUser.password!);

    if (!isCorrect) {
      throw new ApiError(403, "Incorrect old password!");
    }

    const hashSalt = await genSalt(12);
    requestUser.password = await hash(new_password, hashSalt);
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
    const user = c.req.user!;

    let message = user?.setup
      ? "User profile information!"
      : "Please, complete your profile!";

    return ApiResponse(c, 200, message, user);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

export { profileSetup, changePassword, userInformation };
