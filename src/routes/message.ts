import { Hono } from "hono";
import { authAccess } from "~/middlewares";
import { validateSchema, messageSchema } from "~/utils/schema";
import {
  deleteMessages,
  deleteMessage,
  editMessage,
  getMessages,
  sendMessage,
} from "~/controllers/message";

const message = new Hono();

message.get("/get/:id", authAccess, getMessages);

message.post(
  "/send/:id",
  authAccess,
  validateSchema(messageSchema),
  sendMessage
);

message.patch("/edit/:id", authAccess, editMessage);

message.delete("/delete/:id", authAccess, deleteMessage);
message.delete("/delete-messages", authAccess, deleteMessages);

export default message;
