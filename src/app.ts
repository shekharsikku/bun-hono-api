import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { redisReconnect } from "@/middlewares";
import env from "@/utils/env";
import routes from "@/routes";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: env.CORS_ORIGIN,
    maxAge: 3600,
    credentials: true,
  })
);

app.use(
  bodyLimit({
    maxSize: env.BODY_LIMIT * 1024 * 1024,
    onError: (ctx: Context) => {
      return ctx.json({ message: "Request payload is too large!" }, 413);
    },
  })
);

app.use(logger());
app.use(poweredBy());
app.use(prettyJSON());
app.use(secureHeaders());
app.use("/api/*", redisReconnect);

app.get("/hello", (ctx: Context) => {
  const message = "Hono + Bun says hello! Ready to serve your requests!";
  return ctx.json({ message }, 200);
});

app.route("/api", routes);

app.onError((err: Error, ctx: Context) => {
  const message = err.message || "Oops! Something went wrong!";
  console.error(`Error: ${message}`);
  return ctx.json({ message }, 500);
});

app.notFound((ctx: Context) => {
  const message = `Requested url '${ctx.req.path}' not found on the server!`;
  return ctx.json({ message }, 404);
});

export default app;
