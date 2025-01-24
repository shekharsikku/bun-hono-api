import type { Context } from "hono";
import type { DetailInterface } from "../interface";
import { deleteCookie } from "hono/cookie";
import { ApiError, ApiResponse } from "../utils";
import {
  generateHash,
  compareHash,
  generateAccess,
  generateRefresh,
  authorizeCookie,
  hasEmptyField,
  removeSpaces,
  maskedDetails,
  createAccessData,
} from "../helpers";
import User from "../models/user";

const registerUser = async (c: Context) => {
  try {
    const { email, password } = await c.req.json();

    const [existsEmail, hashedPassword] = await Promise.all([
      User.findOne({ email }),
      generateHash(password),
    ]);

    if (existsEmail) {
      throw new ApiError(409, "Email already exists!");
    }

    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    const userData = maskedDetails(newUser);
    return ApiResponse(c, 201, "User registered successfully!", userData);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const loginUser = async (c: Context) => {
  try {
    const { email, username, password } = await c.req.json();
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

    const validatePassword = await compareHash(password, existsUser.password!);

    if (!validatePassword) {
      throw new ApiError(403, "Incorrect password!");
    }

    const accessData = createAccessData(existsUser);
    const accessToken = await generateAccess(c, accessData);

    if (!accessData.setup) {
      const userData = maskedDetails(accessData);
      return ApiResponse(c, 202, "Please, complete your profile!", userData);
    }

    const refreshToken = await generateRefresh(c, accessData._id!);
    const refreshExpiry = parseInt(Bun.env.REFRESH_EXPIRY!);

    /** Saving Refresh Token into Database */
    existsUser.authentication?.push({
      token: refreshToken,
      expiry: new Date(Date.now() + refreshExpiry * 1000),
    });

    const authorizeUser = await existsUser.save();

    /** Extracting Authorized Id of Refresh Token */
    const authorizeId = authorizeUser.authentication?.filter(
      (auth) => auth.token === refreshToken
    )[0]._id!;

    authorizeCookie(c, String(authorizeId));

    return ApiResponse(c, 200, "User login successfully!", {
      _id: accessData._id,
      email: accessData.email,
      setup: accessData.setup,
    });
  } catch (error: any) {
    deleteCookie(c, "access");
    deleteCookie(c, "refresh");
    deleteCookie(c, "auth_id");
    return ApiResponse(c, error.code, error.message);
  }
};

const logoutUser = async (c: Context) => {
  const requestUser = c.req.user!;
  const refreshToken = deleteCookie(c, "refresh");
  const authorizeId = deleteCookie(c, "auth_id");

  if (requestUser.setup && refreshToken && authorizeId) {
    await User.findOneAndUpdate(
      { _id: requestUser._id },
      {
        $pull: {
          authentication: { _id: authorizeId, token: refreshToken },
        },
      },
      { new: true }
    );
  }

  deleteCookie(c, "access");
  const userData = maskedDetails(requestUser);
  return ApiResponse(c, 200, "User logout successfully!", userData);
};

const currentUser = async (c: Context) => {
  const requestUser = c.req.user!;

  if (requestUser?.setup) {
    return ApiResponse(c, 200, "User profile details!", requestUser);
  }
  const userData = maskedDetails(requestUser);
  return ApiResponse(c, 200, "Please, complete your profile!", userData);
};

const refreshAuth = async (c: Context) => {
  const requestUser = c.req.user;
  return ApiResponse(c, 200, "Authentication refreshed!", requestUser);
};

const profileSetup = async (c: Context) => {
  try {
    const details = await c.req.json();
    const username = removeSpaces(details?.username);
    const requestUser = c.req.user;

    if (username !== requestUser?.username) {
      const existsUsername = await User.findOne({ username });

      if (existsUsername) {
        throw new ApiError(409, "Username already exists!");
      }
    }

    const updateDetails: DetailInterface = {
      name: details.name,
      username,
      gender: details.gender,
      bio: details.bio,
    };

    const isEmpty = hasEmptyField({
      name: details.name,
      username,
      gender: details.gender,
    });

    if (!isEmpty) {
      updateDetails.setup = true;
    }

    const updatedProfile = await User.findByIdAndUpdate(
      requestUser?._id,
      { ...updateDetails },
      { new: true }
    );

    if (!updatedProfile) {
      throw new ApiError(400, "Unable to update profile!");
    } else if (!updatedProfile.setup) {
      const userData = maskedDetails(updatedProfile);
      return ApiResponse(c, 200, "Please, complete your profile!", userData);
    }

    const accessData = createAccessData(updatedProfile);
    const accessToken = await generateAccess(c, accessData);

    return ApiResponse(c, 200, "Profile updated successfully!", accessData);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const deleteTokens = async (c: Context) => {
  try {
    const currentDate = new Date();

    const deleteResult = await User.updateMany(
      { "authentication.expiry": { $lt: currentDate } },
      {
        $pull: {
          authentication: { expiry: { $lt: currentDate } },
        },
      }
    );
    return ApiResponse(c, 301, "Expired tokens deleted!", {
      date: currentDate,
      result: deleteResult,
    });
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

const changePassword = async (c: Context) => {
  try {
    const { old_password, new_password } = await c.req.json();

    const [requestUser, hashedPassword] = await Promise.all([
      User.findById(c.req.user?._id).select("+password"),
      generateHash(new_password),
    ]);

    if (!requestUser) {
      throw new ApiError(403, "Invalid authorization!");
    }

    if (old_password === new_password) {
      throw new ApiError(400, "Please, choose a different password!");
    }

    const validatePassword = await compareHash(
      old_password,
      requestUser.password!
    );

    if (!validatePassword) {
      throw new ApiError(403, "Incorrect old password!");
    }

    requestUser.password = hashedPassword;
    const updateResult = await requestUser.save();
    const accessData = createAccessData(updateResult);
    const accessToken = await generateAccess(c, accessData);

    return ApiResponse(c, 202, "Password changed successfully!", accessData);
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
  refreshAuth,
  profileSetup,
  deleteTokens,
  changePassword,
};
