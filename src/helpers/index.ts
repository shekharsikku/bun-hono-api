import type { Context } from "hono";
import type { Options } from "argon2";
import type { UserInterface } from "../interface";
import { Types } from "mongoose";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";
import env from "../utils/env";

const generateIssuedExpired = (seconds: number) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  return { iat: issuedAt, exp: issuedAt + seconds };
};

const generateAccess = async (c: Context, user: UserInterface) => {
  const accessExpiry = env.ACCESS_EXPIRY;
  const { iat, exp } = generateIssuedExpired(accessExpiry);

  const accessToken = await sign(
    { user, iat, exp },
    env.ACCESS_SECRET,
    "HS256"
  );

  setCookie(c, "access", accessToken, {
    maxAge: accessExpiry,
    httpOnly: true,
    sameSite: "Strict",
    secure: env.isProd,
  });

  return accessToken;
};

const generateRefresh = async (c: Context, uid: Types.ObjectId) => {
  const refreshExpiry = env.REFRESH_EXPIRY;
  const { iat, exp } = generateIssuedExpired(refreshExpiry);

  const refreshToken = await sign(
    { uid, iat, exp },
    env.REFRESH_SECRET,
    "HS512"
  );

  setCookie(c, "refresh", refreshToken, {
    maxAge: refreshExpiry * 2,
    httpOnly: true,
    sameSite: "Strict",
    secure: env.isProd,
  });

  return refreshToken;
};

const authorizeCookie = (c: Context, authId: string) => {
  const authExpiry = env.REFRESH_EXPIRY;

  setCookie(c, "current", authId, {
    maxAge: authExpiry * 2,
    httpOnly: true,
    sameSite: "Strict",
    secure: env.isProd,
  });
};

const hasEmptyField = (fields: object) => {
  return Object.values(fields).some(
    (value) => value === "" || value === undefined || value === null
  );
};

const createUserInfo = (user: UserInterface) => {
  let userInfo;

  if (user.setup) {
    userInfo = {
      ...user.toObject(),
      password: undefined,
      authentication: undefined,
    };
  } else {
    userInfo = {
      _id: user._id,
      email: user.email,
      setup: user.setup,
    };
  }

  return userInfo as UserInterface;
};

const argonOptions: Options = {
  type: 2,
  timeCost: 4,
  memoryCost: 2 ** 16,
  parallelism: 2,
  hashLength: 32,
};

export {
  generateAccess,
  generateRefresh,
  authorizeCookie,
  hasEmptyField,
  createUserInfo,
  argonOptions,
};
