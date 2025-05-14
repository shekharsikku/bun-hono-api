import { Hono } from "hono";
import { authAccess } from "~/middlewares";
import { validateSchema, profileSchema, passwordSchema } from "~/utils/schema";
import {
  profileSetup,
  changePassword,
  userInformation,
  updateImage,
  deleteImage,
  searchUsers,
  fetchContacts,
} from "~/controllers/user";

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
user.patch("/update-image", authAccess, updateImage);
user.delete("/delete-image", authAccess, deleteImage);
user.get("/user-information", authAccess, userInformation);
user.get("/search-users", authAccess, searchUsers);
user.get("/fetch-contacts", authAccess, fetchContacts);

export default user;
