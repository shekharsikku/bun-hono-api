import { connect } from "mongoose";
import socket from "~/server";
import env from "~/utils/env";
import app from "~/app";

(async () => {
  try {
    const { connection } = await connect(env.MONGODB_URI);

    if (connection.readyState === 1) {
      console.log("Database connection success!");

      const server = Bun.serve({
        port: env.PORT,
        fetch: app.fetch,
        maxRequestBodySize: env.BODY_LIMIT * 1024 * 1024,
      });

      console.log(`Hono server at: ${server.url}`);

      socket.listen(env.SOCKET_PORT, () => {
        console.log(`Socket server at: http://localhost:${env.SOCKET_PORT}`);
      });
    }
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
})();
