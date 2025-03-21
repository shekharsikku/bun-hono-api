import { Hono } from "hono";
import { authAccess, authRefresh } from "@/middlewares";
import { validateSchema, signInSchema, signUpSchema } from "@/utils/schema";
import {
  refreshAuth,
  signInUser,
  signOutUser,
  signUpUser,
} from "@/controllers/auth";

const auth = new Hono();

auth.post("/sign-up", validateSchema(signUpSchema), signUpUser);
auth.post("/sign-in", validateSchema(signInSchema), signInUser);
auth.all("/sign-out", authAccess, signOutUser);
auth.get("/auth-refresh", authRefresh, refreshAuth);

export default auth;
