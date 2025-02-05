import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import env from "./utils/env";
import routes from "./routes";

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
    onError: (c: Context) => {
      return c.json({ error: "Request payload is too large!" }, 413);
    },
  })
);

app.use(logger());
app.use(poweredBy());
app.use(prettyJSON());
app.use(secureHeaders());

app.get("/hello", (c: Context) => {
  return c.json({ message: "Hello from Hono via Bun!" });
});

app.route("/api", routes);

app.onError((e: Error, c: Context) => {
  const message = e.message || "Something Went Wrong!";
  console.log(`Error: ${message}`);
  return c.json({ error: message }, 500);
});

app.notFound((c: Context) => {
  const message = `Requested url '${c.req.path}' not found on the server!`;
  return c.json({ error: message }, 404);
});

export default app;
