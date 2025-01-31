import type { MiddlewareHandler, Context, Next } from "hono";
import type { UserInterface } from "../interface";
import type { Types } from "mongoose";
import { ApiError, ApiResponse } from "../utils";
import { getCookie, deleteCookie } from "hono/cookie";
import { verify, decode } from "hono/jwt";
import {
  generateAccess,
  generateRefresh,
  createAccessData,
  authorizeCookie,
} from "../helpers";
import User from "../models/user";
import env from "../utils/env";

const authAccess: MiddlewareHandler = async (
  c: Context,
  next: Next
): Promise<any> => {
  try {
    /** Check for Access Token */
    const accessToken = getCookie(c, "access");
    const accessSecret = env.ACCESS_SECRET;

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized access request!");
    }

    /** JWT Verification */
    let decodedPayload;

    try {
      decodedPayload = await verify(accessToken, accessSecret, "HS256");
    } catch (error: any) {
      throw new ApiError(403, "Invalid access request!");
    }

    /** Setting the Request and Proceeding */
    c.req.user = decodedPayload.user as UserInterface;
    await next();
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const deleteToken = async (
  c: Context,
  userId: Types.ObjectId,
  refreshToken: string
) => {
  /** Extract Refresh Token ObjectId from Cookie */
  const authorizeId = deleteCookie(c, "auth_id");

  /** Query for Remove Expired Refresh Token */
  const deleteResponse = await User.findOneAndUpdate(
    { _id: userId },
    {
      $pull: {
        authentication: { _id: authorizeId, token: refreshToken },
      },
    },
    { new: true }
  );

  /** Clearing Other Cookies if Response */
  if (deleteResponse) {
    deleteCookie(c, "access");
    deleteCookie(c, "refresh");
  }
};

const authRefresh: MiddlewareHandler = async (
  c: Context,
  next: Next
): Promise<any> => {
  try {
    /** Check for Refresh Token */
    const refreshToken = getCookie(c, "refresh");
    const refreshSecret = env.REFRESH_SECRET;

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized refresh request!");
    }

    /** JWT Verification */
    let decodedPayload;

    try {
      decodedPayload = await verify(refreshToken, refreshSecret, "HS512");
    } catch (err: any) {
      if (err.message.includes("expired")) {
        /** Manually Decoding Payload for Extract UserId */
        const { header, payload } = decode(refreshToken);

        /** Getting User Id from Token Payload */
        const userId = payload.uid as Types.ObjectId;

        /** Delete Existing Refresh Token if Expired */
        await deleteToken(c, userId, refreshToken);
        throw new ApiError(401, "Please, login again to continue!");
      } else {
        throw new ApiError(403, "Invalid refresh request!");
      }
    }

    const userId = decodedPayload.uid as Types.ObjectId;
    const timeBefore = decodedPayload.exp! - env.ACCESS_EXPIRY;
    const currentTime = Math.floor(Date.now() / 1000);

    /** User Lookup from Database */
    const requestUser = await User.findOne({
      _id: userId,
      authentication: {
        $elemMatch: { token: refreshToken },
      },
    });

    if (!requestUser) {
      throw new ApiError(403, "Invalid user request!");
    }

    const accessData = createAccessData(requestUser);

    /** Expiration & Refresh Logic of Tokens */
    if (currentTime >= timeBefore && currentTime < decodedPayload.exp!) {
      const newRefreshToken = await generateRefresh(c, userId);
      const refreshExpiry = env.REFRESH_EXPIRY;
      const authorizeId = getCookie(c, "auth_id");

      /** Update Existing Refresh Token in Database */
      const updatedAuth = await User.findOneAndUpdate(
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
        },
        { new: true }
      );

      if (updatedAuth) {
        /** Generate new Access Token and Update Authorize Cookie */
        authorizeCookie(c, authorizeId!);
        const accessToken = await generateAccess(c, accessData);
      }
    } else if (currentTime >= decodedPayload.exp!) {
      /** Delete Existing Refresh Token if Expired */
      await deleteToken(c, requestUser._id, refreshToken);
      throw new ApiError(401, "Please, login again to continue!");
    } else {
      /** If Token is Still Valid, Generate new Access Token */
      const accessToken = await generateAccess(c, accessData);
    }

    /** Setting the Request and Proceeding */
    c.req.user = accessData as UserInterface;
    await next();
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

export { authAccess, authRefresh };
