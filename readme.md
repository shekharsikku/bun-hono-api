## **Synchronous Chat Api using Bun & Hono**

This is a lightweight, high-performance Api built with `Bun` and `Hono`, leveraging `Mongoose` for MongoDB interactions, `ioredis` for Redis client, `argon2` for password hashing, and `Zod` for validation.

### **Packages Installation**

Ensure you have `Bun` installed, then run:

```bash
bun install
```

### **Environment Variables**

Rename, `.env.sample` file to `.env` and define required variables:

```env
IMAGEKIT_PUBLIC_KEY=""
IMAGEKIT_PRIVATE_KEY=""
IMAGEKIT_URL_ENDPOINT=""

RESEND_API_KEY="",
RESEND_ORIGIN="",

ACCESS_SECRET=""
ACCESS_EXPIRY=""

REFRESH_SECRET=""
REFRESH_EXPIRY=""

MONGODB_URI=""
REDIS_URI=""
CORS_ORIGIN=""
PORT=""
SOCKET_PORT=""

BUCKET_DB_NAME=""
BUCKET_PREFIX=""

BODY_LIMIT=""
NODE_ENV=""
```

Note: `BODY_LIMIT` is in MB & `NODE_ENV` should be development or production.

### **Running the Project**

#### Development Mode

```bash
bun run dev
```

#### Production Mode

```bash
bun run start
```

### **Project Structure**

```
.
├── src/
│   ├── index.ts        # Entry Point
│   ├── server.ts       # Socket Server Config
│   ├── app.ts          # Hono App Config
│   ├── routes/         # API Routes
│   ├── models/         # Mongoose Models
│   ├── middleware/     # Custom Middlewares
│   ├── utils/          # Utility Functions
│   ├── interface/      # Types & Interfaces
│   ├── database/       # Mongoose & Redis Config
│   ├── controllers/    # API Controllers
│
├── bun.lockb           # Bun Lockfile
├── package.json        # Project Metadata
└── readme.md           # Documentation
```

This project was created using `bun init` in bun v1.2.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

---
