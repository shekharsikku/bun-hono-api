import { Hono } from "hono";
import { authAccess, authRefresh } from "../middlewares";
import {
  validateSchema,
  registerSchema,
  loginSchema,
  profileSchema,
  passwordSchema,
} from "../utils/schema";
import {
  registerUser,
  loginUser,
  logoutUser,
  currentUser,
  refreshAuth,
  profileSetup,
  deleteTokens,
  changePassword,
} from "../controllers/user";

const user = new Hono().basePath("/api/user");

user.post("/register", validateSchema(registerSchema), registerUser);
user.post("/login", validateSchema(loginSchema), loginUser);

user.delete("/delete-expired-tokens", deleteTokens);
user.delete("/logout", authAccess, logoutUser);

user.patch(
  "/profile-setup",
  authAccess,
  validateSchema(profileSchema),
  profileSetup
);
user.patch(
  "/change-password",
  authAccess,
  validateSchema(passwordSchema),
  changePassword
);

user.get("/current-user", authAccess, currentUser);
user.get("/refresh-auth", authRefresh, refreshAuth);

export default user;
