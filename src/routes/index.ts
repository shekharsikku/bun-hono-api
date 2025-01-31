import { Hono, type Context } from "hono";
import { ApiResponse } from "../utils";
import AuthRoutes from "./auth";
import UserRoutes from "./user";
import FeedRoutes from "./feed";
import User from "../models/user";

const routes = new Hono().basePath("/api");

routes.route("/auth", AuthRoutes);
routes.route("/user", UserRoutes);
routes.route("/feed", FeedRoutes);

/** For delete expired auth tokens */
routes.delete("/delete-tokens", async (c: Context) => {
  try {
    const currentDate = new Date();

    const deleteResult = await User.updateMany(
      { "authentication.expiry": { $lt: currentDate } },
      {
        $pull: {
          authentication: { expiry: { $lt: currentDate } },
        },
      }
    );
    return ApiResponse(c, 301, "Expired tokens deleted!", {
      date: currentDate,
      result: deleteResult,
    });
  } catch (error: any) {
    return ApiResponse(c, error.code, error.message);
  }
});

export default routes;
