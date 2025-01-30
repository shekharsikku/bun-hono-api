## **Bun + Hono API**

This is a lightweight, high-performance API built with **Bun** and **Hono**, leveraging **Mongoose** for MongoDB interactions, **bcryptjs** for password hashing, and **Zod** for validation.

### **Features**

- **Fast and lightweight** using [Bun](https://bun.sh/) and [Hono](https://hono.dev/)
- **Secure authentication** with [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Environment validation** using [Envalid](https://www.npmjs.com/package/envalid)
- **MongoDB ORM** with [Mongoose](https://mongoosejs.com/)
- **Schema validation** with [Zod](https://zod.dev/)

### **Installation**

Ensure you have [Bun](https://bun.sh/) installed, then run:

```bash
bun install
```

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
│
├── bun.lockb       # Lockfile
├── package.json    # Project metadata
└── README.md       # Documentation
```

### **Dependencies Overview**

#### Core Dependencies

- **[Hono](https://hono.dev/)** - A fast web framework for Bun
- **[Mongoose](https://mongoosejs.com/)** - ODM for MongoDB
- **[bcryptjs](https://www.npmjs.com/package/bcryptjs)** - Secure password hashing
- **[Zod](https://zod.dev/)** - Schema validation library
- **[Envalid](https://www.npmjs.com/package/envalid)** - Type-safe environment variable validation

#### Development Dependencies

- **[@types/bun](https://www.npmjs.com/package/@types/bun)** - TypeScript types for Bun
- **[@types/bcryptjs](https://www.npmjs.com/package/@types/bcryptjs)** - Type definitions for bcryptjs

#### Peer Dependencies

- **[TypeScript](https://www.typescriptlang.org/)** - Strongly-typed JavaScript

### **Environment Variables**

Create a `.env` file and define required variables:

```env
ACCESS_SECRET=""
ACCESS_EXPIRY=""

REFRESH_SECRET=""
REFRESH_EXPIRY=""

MONGODB_URI=""
CORS_ORIGIN=""
PORT=""
BODY_LIMIT=""
NODE_ENV=""
```

Note: `NODE_ENV` should be development or production.

This project was created using `bun init` in bun v1.2.1. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

---
