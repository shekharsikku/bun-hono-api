import type { Context } from "hono";
import type { UserInterface } from "../interface";
import { Types } from "mongoose";
import { genSalt, hash, compare } from "bcryptjs";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";

const generateHash = async (password: string): Promise<string> => {
  const salt = await genSalt(12);
  const hashed = await hash(password, salt);
  return hashed;
};

const compareHash = async (
  password: string,
  hashed: string
): Promise<boolean> => {
  const checked = await compare(password, hashed);
  return checked;
};

const generateIssuedExpired = (seconds: number) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  return { iat: issuedAt, exp: issuedAt + seconds };
};

const generateAccess = async (c: Context, user: UserInterface) => {
  const accessSecret = Bun.env.ACCESS_SECRET!;
  const accessExpiry = parseInt(Bun.env.ACCESS_EXPIRY!);
  const { iat, exp } = generateIssuedExpired(accessExpiry);

  const accessToken = await sign({ user, iat, exp }, accessSecret, "HS256");

  setCookie(c, "access", accessToken, {
    maxAge: accessExpiry,
    httpOnly: true,
    sameSite: "Strict",
    secure: Bun.env.NODE_ENV !== "development",
  });

  return accessToken;
};

const generateRefresh = async (c: Context, uid: Types.ObjectId) => {
  const refreshSecret = Bun.env.REFRESH_SECRET!;
  const refreshExpiry = parseInt(Bun.env.REFRESH_EXPIRY!);
  const { iat, exp } = generateIssuedExpired(refreshExpiry);

  const refreshToken = await sign({ uid, iat, exp }, refreshSecret, "HS512");

  setCookie(c, "refresh", refreshToken, {
    maxAge: refreshExpiry * 2,
    httpOnly: true,
    sameSite: "Strict",
    secure: Bun.env.NODE_ENV !== "development",
  });

  return refreshToken;
};

const authorizeCookie = (c: Context, authorizeId: string) => {
  const authExpiry = parseInt(Bun.env.REFRESH_EXPIRY!);

  if (authorizeId) {
    setCookie(c, "auth_id", authorizeId.toString(), {
      maxAge: authExpiry * 2,
      httpOnly: true,
      sameSite: "Strict",
      secure: Bun.env.NODE_ENV !== "development",
    });
  }
};

const hasEmptyField = (fields: object) => {
  return Object.values(fields).some(
    (value) => value === "" || value === undefined || value === null
  );
};

const removeSpaces = (str: string) => {
  return str.replace(/\s+/g, "");
};

const capitalizeWord = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str: string) => {
  return str
    .split(" ")
    .map((word) => capitalizeWord(word))
    .join(" ");
};

const maskedObjectId = (objectId: Types.ObjectId) => {
  const idStr = objectId.toString();
  const maskedId = idStr.slice(0, 4) + "****" + idStr.slice(-4);
  return maskedId;
};

const maskedEmail = (email: string) => {
  const [localPart, domain] = email.split("@");
  const maskedLocalPart = localPart.slice(0, 4) + "***";
  return `${maskedLocalPart}@${domain}`;
};

const maskedDetails = (details: UserInterface) => {
  const maskId = maskedObjectId(details._id!);
  const maskEmail = maskedEmail(details.email);
  return {
    _id: maskId,
    email: maskEmail,
    setup: details.setup!,
  };
};

const createAccessData = (user: UserInterface) => {
  const accessData = {
    ...user.toObject(),
    password: undefined,
    authentication: undefined,
  };
  return accessData as UserInterface;
};

export {
  generateHash,
  compareHash,
  generateAccess,
  generateRefresh,
  authorizeCookie,
  hasEmptyField,
  removeSpaces,
  maskedDetails,
  createAccessData,
};
