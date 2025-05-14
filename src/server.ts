import { createServer } from "http";
import { Server } from "socket.io";
import { redis } from "~/database";
import env from "~/utils/env";

const server = createServer();

export const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.uid as string;
  const socketId = socket.id;

  if (userId && redis.status === "ready") {
    redis.sadd(`sockets:${userId}`, socketId);
    console.log("Client connected:", socketId, userId);
  } else {
    console.log("Cannot get 'uid' or 'redis' is down for socket connection!");
  }

  socket.on("disconnect", async () => {
    await redis.srem(`sockets:${userId}`, socketId);
    console.log(`User ${userId} disconnected from socket ${socketId}`);

    const remaining = await redis.scard(`sockets:${userId}`);

    if (remaining === 0) {
      await redis.del(`sockets:${userId}`);
    }
  });
});

export default server;
