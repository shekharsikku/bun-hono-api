import { Hono } from "hono";
import AuthRoutes from "@/routes/auth";
import UserRoutes from "@/routes/user";
import FeedRoutes from "@/routes/feed";
import FriendRoutes from "@/routes/friend";
import MessageRoutes from "@/routes/message";

const routes = new Hono();

routes.route("/auth", AuthRoutes);
routes.route("/user", UserRoutes);
routes.route("/feed", FeedRoutes);
routes.route("/friend", FriendRoutes);
routes.route("/message", MessageRoutes);

export default routes;
