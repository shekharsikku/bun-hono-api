import { createServer } from "http";
import { Server } from "socket.io";
import { mongodb } from "@/database";
import env from "@/utils/env";
import app from "@/app";

const httpServer = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
  maxRequestBodySize: env.BODY_LIMIT * 1024 * 1024,
});

const socketServer = createServer();
const connectionState = await mongodb();

if (connectionState === 1) {
  console.log("Database connection success!");
  console.log(`Running at: ${httpServer.url}`);
  socketServer.listen(env.SOCKET_PORT, () => {
    console.log(`Socket server at: http://localhost:${env.SOCKET_PORT}`);
  });
} else {
  console.error("Error: Database connection error!");
  process.exit(1);
}

const io = new Server(socketServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.uid as string;
  console.log("Client connected:", socket.id, userId);

  socket.on("join", (key) => {
    socket.join(key);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

export { io };
