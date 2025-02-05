## **Bun & Hono Api**

This is a lightweight, high-performance Api built with `Bun` and `Hono`, leveraging `Mongoose` for MongoDB interactions, `bcryptjs` for password hashing, and `Zod` for validation.

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

MONGODB_URI=""

ACCESS_SECRET=""
ACCESS_EXPIRY=""

REFRESH_SECRET=""
REFRESH_EXPIRY=""

PORT=""
CORS_ORIGIN=""
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
│   ├── index.ts    # Entry point
│   ├── app.ts      # Hono app config
│   ├── routes/     # API routes
│   ├── models/     # Mongoose models
│   ├── middleware/ # Custom middlewares
│   ├── utils/      # Utility functions
│   ├── helpers/    # Helper functions
│
├── bun.lockb       # Lockfile
├── package.json    # Project metadata
└── README.md       # Documentation
```

This project was created using `bun init` in bun v1.2.1. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

---
