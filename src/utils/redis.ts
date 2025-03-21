import type { UserInterface } from "@/interface";
import { Types } from "mongoose";
import { redis } from "@/database";

const setData = async (data: UserInterface, exp = 1800) => {
  try {
    const key = `user:${data._id}`;
    const value = JSON.stringify(data);

    return await redis?.set(key, value, "EX", exp);
  } catch (error: any) {
    return null;
  }
};

const getData = async (uid: Types.ObjectId) => {
  try {
    const key = `user:${uid}`;
    const data = await redis?.get(key);

    if (!data) return null;
    return JSON.parse(data) as UserInterface;
  } catch (error: any) {
    return null;
  }
};

const delData = async (uid: Types.ObjectId) => {
  try {
    const key = `user:${uid}`;
    return await redis?.del(key);
  } catch (error: any) {
    return null;
  }
};

export { setData, getData, delData };
