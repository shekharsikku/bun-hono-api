import mongodb from "./mongodb";
import app from "./app";

(async () => {
  try {
    const state = await mongodb(Bun.env.MONGODB_URI!);

    if (state === 1) {
      const server = Bun.serve({
        port: Bun.env.PORT!,
        fetch: app.fetch,
      });
      console.log("Database connection success!");
      console.log(`Running at: ${server.url}`);
    } else {
      throw new Error("Database connection error!");
    }
  } catch (error: any) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
})();
