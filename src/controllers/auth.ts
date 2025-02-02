import type { Context } from "hono";
import { deleteCookie } from "hono/cookie";
import { genSalt, hash, compare } from "bcryptjs";
import { ApiError, ApiResponse } from "../utils";
import {
  authorizeCookie,
  createUserInfo,
  generateAccess,
  generateRefresh,
} from "../helpers";
import User from "../models/user";
import env from "../utils/env";

const signUpUser = async (c: Context) => {
  try {
    const { email, password } = c.get("validData");

    const existsEmail = await User.exists({ email });

    if (existsEmail) {
      throw new ApiError(409, "Email already exists!");
    }

    const hashSalt = await genSalt(12);
    const hashedPassword = await hash(password, hashSalt);

    await User.create({ email, password: hashedPassword });

    return ApiResponse(c, 201, "Signed up successfully!");
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const signInUser = async (c: Context) => {
  try {
    const { email, username, password } = c.get("validData");
    const conditions = [];

    if (email) {
      conditions.push({ email });
    } else if (username) {
      conditions.push({ username });
    } else {
      throw new ApiError(400, "Email or Username required!");
    }

    const existsUser = await User.findOne({
      $or: conditions,
    }).select("+password +authentication");

    if (!existsUser) {
      throw new ApiError(404, "User not exists!");
    }

    const isCorrect = await compare(password, existsUser.password!);

    if (!isCorrect) {
      throw new ApiError(403, "Incorrect password!");
    }

    const userInfo = createUserInfo(existsUser);
    await generateAccess(c, userInfo);

    if (!userInfo.setup) {
      return ApiResponse(c, 202, "Please, complete your profile!", userInfo);
    }

    const refreshToken = await generateRefresh(c, userInfo._id!);
    const refreshExpiry = env.REFRESH_EXPIRY;

    existsUser.authentication?.push({
      token: refreshToken,
      expiry: new Date(Date.now() + refreshExpiry * 1000),
    });

    const authorizeUser = await existsUser.save();
    const authorizeId = authorizeUser.authentication?.filter(
      (auth) => auth.token === refreshToken
    )[0]._id!;

    authorizeCookie(c, authorizeId.toString());

    return ApiResponse(c, 200, "Signed in successfully!", userInfo);
  } catch (error: any) {
    deleteCookie(c, "access");
    deleteCookie(c, "refresh");
    deleteCookie(c, "current");
    return ApiResponse(c, error.code, error.message);
  }
};

const signOutUser = async (c: Context) => {
  const requestUser = c.get("requestUser");
  const refreshToken = deleteCookie(c, "refresh");
  const authorizeId = deleteCookie(c, "current");

  if (requestUser.setup && refreshToken && authorizeId) {
    await User.updateOne(
      { _id: requestUser._id },
      {
        $pull: {
          authentication: { _id: authorizeId, token: refreshToken },
        },
      }
    );
  }

  deleteCookie(c, "access");
  return ApiResponse(c, 200, "Signed out successfully!", requestUser);
};

const refreshAuth = async (c: Context) => {
  const requestUser = c.get("requestUser");
  return ApiResponse(c, 200, "Authentication refreshed!", requestUser);
};

export { signUpUser, signInUser, signOutUser, refreshAuth };
