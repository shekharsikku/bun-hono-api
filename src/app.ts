import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";
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
app.use(poweredBy());
app.use(prettyJSON());
app.use(secureHeaders());

app.all("/hello", (c: Context) => {
  return c.json({ message: "Hello from Hono via Bun!" });
});

app.onError((e: Error, c: Context) => {
  console.log({ e });
  return c.json({ error: e.message }, 500);
});

app.notFound((c: Context) => {
  const message = `Requested url '${c.req.path}' not found on the server!`;
  return c.json({ notfound: message }, 404);
});

import UserRoutes from "./routes/user";

app.route("/", UserRoutes);

export default app;
