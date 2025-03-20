import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { mongodb } from "@/database";
import env from "@/utils/env";
import app from "@/app";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

const state = await mongodb();

if (state === 1) {
  console.log("Database connection success!");
  console.log(`Running at: ${server.url}`);
} else {
  console.error("Error: Database connection error!");
  process.exit(1);
}

const io = new Server(server as unknown as HttpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join", (key) => {
    socket.join(key);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

export { io };
