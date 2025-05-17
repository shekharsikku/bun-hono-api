import type { Context } from "hono";
import { deleteCookie } from "hono/cookie";
import { hash, verify } from "argon2";
import { ApiError, ApiResponse } from "~/utils";
import { setData, delData } from "~/utils/redis";
import {
  authorizeCookie,
  createUserInfo,
  generateAccess,
  generateRefresh,
  argonOptions,
} from "~/utils/helpers";
import User from "~/models/user";
import env from "~/utils/env";

const signUpUser = async (ctx: Context) => {
  try {
    const { email, password } = ctx.get("validated");

    const existsEmail = await User.exists({ email });

    if (existsEmail) {
      throw new ApiError(409, "Email already exists!");
    }

    const hashedPassword = await hash(password, argonOptions);

    await User.create({ email, password: hashedPassword });

    return ApiResponse(ctx, 201, "Signed up successfully!");
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const signInUser = async (ctx: Context) => {
  try {
    const { email, username, password } = ctx.get("validated");
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

    const isCorrect = await verify(existsUser.password!, password);

    if (!isCorrect) {
      throw new ApiError(403, "Incorrect password!");
    }

    const userInfo = createUserInfo(existsUser);
    await generateAccess(ctx, userInfo._id!);
    await setData(userInfo);

    if (!userInfo.setup) {
      return ApiResponse(ctx, 200, "Please, complete your profile!", userInfo);
    }

    const refreshToken = await generateRefresh(ctx, userInfo._id!);
    const refreshExpiry = env.REFRESH_EXPIRY;

    existsUser.authentication?.push({
      token: refreshToken,
      expiry: new Date(Date.now() + refreshExpiry * 1000),
    });

    const authorizeUser = await existsUser.save();
    const authorizeId = authorizeUser.authentication?.find(
      (auth) => auth.token === refreshToken
    )?._id!;

    authorizeCookie(ctx, authorizeId.toString());

    return ApiResponse(ctx, 200, "Signed in successfully!", userInfo);
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const signOutUser = async (ctx: Context) => {
  const requestUser = ctx.req.user!;
  const refreshToken = deleteCookie(ctx, "refresh");
  const authorizeId = deleteCookie(ctx, "current");

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

  deleteCookie(ctx, "access");
  await delData(requestUser._id!);
  return ApiResponse(ctx, 200, "Signed out successfully!");
};

const refreshAuth = async (ctx: Context) => {
  const requestUser = ctx.req.user;
  return ApiResponse(ctx, 200, "Authentication refreshed!", requestUser);
};

export { signUpUser, signInUser, signOutUser, refreshAuth };
