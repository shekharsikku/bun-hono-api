import { Hono } from "hono";
import authRoutes from "@/routes/auth";
import userRoutes from "@/routes/user";
import feedRoutes from "@/routes/feed";
import friendRoutes from "@/routes/friend";
import messageRoutes from "@/routes/message";
import filesRoutes from "@/routes/files";

const routes = new Hono();

routes.route("/auth", authRoutes);
routes.route("/user", userRoutes);
routes.route("/feed", feedRoutes);
routes.route("/friend", friendRoutes);
routes.route("/message", messageRoutes);
routes.route("/files", filesRoutes);

export default routes;
