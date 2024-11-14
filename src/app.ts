import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: Bun.env.CORS_ORIGIN!,
    maxAge: 3600,
    credentials: true,
  })
);
app.use(csrf());
app.use(logger());
app.use(
  bodyLimit({
    maxSize: parseInt(Bun.env.BODY_LIMIT!) * 1024,
    onError: (c) => {
      return c.json({ error: "Request payload is too large!" }, 413);
    },
  })
);
app.use(poweredBy());
app.use(prettyJSON());
app.use(secureHeaders());

app.all("/hello", (c: Context) => {
  return c.json({ message: "Hello from Hono via Bun!" });
});

app.onError((e: Error, c: Context) => {
  console.log(`${e.name}: ${e.message}`);
  return c.json({ error: e.message }, 500);
});

app.notFound((c: Context) => {
  const message = `Requested url '${c.req.path}' not found on the server!`;
  return c.json({ notfound: message }, 404);
});

import UserRoutes from "./routes/user";
import FeedRoutes from "./routes/feed";

app.route("/", UserRoutes);
app.route("/", FeedRoutes);

export default app;
