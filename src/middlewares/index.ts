import type { MiddlewareHandler, Context, Next } from "hono";
import type { Types } from "mongoose";
import { ApiError, ApiResponse } from "~/utils";
import { setData, getData } from "~/utils/redis";
import { getCookie, deleteCookie } from "hono/cookie";
import { verify, decode } from "hono/jwt";
import {
  generateAccess,
  generateRefresh,
  createUserInfo,
  authorizeCookie,
} from "~/utils/helpers";
import { redis } from "~/database";
import User from "~/models/user";
import env from "~/utils/env";

const authAccess: MiddlewareHandler = async (
  ctx: Context,
  next: Next
): Promise<any> => {
  try {
    const accessToken = getCookie(ctx, "access");
    const accessSecret = env.ACCESS_SECRET;

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized access request!");
    }

    let decodedPayload;

    try {
      decodedPayload = await verify(accessToken, accessSecret, "HS256");
    } catch (error: any) {
      throw new ApiError(403, "Invalid access request!");
    }

    let userData = await getData(decodedPayload.uid as Types.ObjectId);

    if (userData) {
      ctx.req.user = userData;
      return await next();
    }

    userData = await User.findById(decodedPayload.uid);
    const userInfo = createUserInfo(userData!);

    await setData(userInfo);
    ctx.req.user = userInfo;
    await next();
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const deleteToken = async (
  ctx: Context,
  userId: Types.ObjectId,
  refreshToken: string
) => {
  const authorizeId = deleteCookie(ctx, "current");

  await User.updateOne(
    { _id: userId },
    {
      $pull: {
        authentication: { _id: authorizeId, token: refreshToken },
      },
    }
  );

  deleteCookie(ctx, "access");
  deleteCookie(ctx, "refresh");
};

const authRefresh: MiddlewareHandler = async (
  ctx: Context,
  next: Next
): Promise<any> => {
  try {
    const refreshToken = getCookie(ctx, "refresh");
    const authorizeId = getCookie(ctx, "current");
    const refreshSecret = env.REFRESH_SECRET;

    if (!refreshToken || !authorizeId) {
      throw new ApiError(401, "Unauthorized refresh request!");
    }

    let decodedPayload;

    try {
      decodedPayload = await verify(refreshToken, refreshSecret, "HS512");
    } catch (err: any) {
      if (err.message.includes("expired")) {
        const { payload } = decode(refreshToken);
        const userId = payload.uid as Types.ObjectId;

        await deleteToken(ctx, userId, refreshToken);
        throw new ApiError(401, "Please, login again to continue!");
      } else {
        throw new ApiError(403, "Invalid refresh request!");
      }
    }

    const userId = decodedPayload.uid as Types.ObjectId;
    const timeBefore = decodedPayload.exp! - env.REFRESH_EXPIRY / 2;
    const currentTime = Math.floor(Date.now() / 1000);

    const requestUser = await User.findOne({
      _id: userId,
      authentication: {
        $elemMatch: {
          _id: authorizeId,
          token: refreshToken,
        },
      },
    });

    if (!requestUser) {
      throw new ApiError(403, "Invalid user request!");
    }

    const userInfo = createUserInfo(requestUser);

    if (currentTime >= timeBefore && currentTime < decodedPayload.exp!) {
      const newRefreshToken = await generateRefresh(ctx, userId);
      const refreshExpiry = env.REFRESH_EXPIRY;

      const updatedAuth = await User.updateOne(
        {
          _id: userId,
          authentication: {
            $elemMatch: { _id: authorizeId, token: refreshToken },
          },
        },
        {
          $set: {
            "authentication.$.token": newRefreshToken,
            "authentication.$.expiry": new Date(
              Date.now() + refreshExpiry * 1000
            ),
          },
        }
      );

      if (updatedAuth.modifiedCount > 0) {
        authorizeCookie(ctx, authorizeId!);
        await generateAccess(ctx, userId);
      } else {
        throw new ApiError(403, "Invalid refresh request!");
      }
    } else if (currentTime >= decodedPayload.exp!) {
      await deleteToken(ctx, requestUser._id, refreshToken);
      throw new ApiError(401, "Please, login again to continue!");
    } else {
      await generateAccess(ctx, userId);
    }

    await setData(userInfo);
    ctx.req.user = userInfo;
    await next();
  } catch (error: any) {
    return ApiResponse(ctx, error.code, error.message);
  }
};

const redisReconnect: MiddlewareHandler = async (
  ctx: Context,
  next: Next
): Promise<any> => {
  if (!redis || redis.status !== "ready") {
    console.warn("Redis is disconnected! Attempting to reconnect...");
    try {
      await redis?.connect();
      console.log("Redis reconnected successfully!");
    } catch (error: any) {
      console.error("Redis reconnection failed!", error.message);
    }
  }
  await next();
};

export { authAccess, authRefresh, redisReconnect };
