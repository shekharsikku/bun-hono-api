import { Hono } from "hono";
import { authAccess } from "@/middlewares";
import {
  sendRequest,
  handleRequest,
  retrieveRequest,
  pendingRequests,
  unfriendUser,
  fetchFriends,
} from "@/controllers/friend";

const friend = new Hono();

friend.post("/request-send", authAccess, sendRequest);

friend.patch("/request-handle", authAccess, handleRequest);
friend.patch("/request-retrieve", authAccess, retrieveRequest);

friend.delete("/unfriend", authAccess, unfriendUser);

friend.get("/request-pending", authAccess, pendingRequests);
friend.get("/fetch-list", authAccess, fetchFriends);

export default friend;
