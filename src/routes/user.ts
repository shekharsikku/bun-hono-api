import { Hono } from "hono";
import { authAccess } from "../middlewares";
import { validateSchema, profileSchema, passwordSchema } from "../utils/schema";
import {
  profileSetup,
  changePassword,
  userInformation,
} from "../controllers/user";

const user = new Hono();

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

user.get("/user-information", authAccess, userInformation);

export default user;
