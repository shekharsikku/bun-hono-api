import type { Context, Next } from "hono";
import { z, ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../utils";

const ValidationError = (
  error: ZodError
): { path: string; message: string }[] => {
  return error.errors.map((err) => ({
    path: err.path.join(", "),
    message: err.message,
  }));
};

const validateSchema =
  (schema: ZodSchema) => async (c: Context, next: Next) => {
    try {
      const jsonData = await c.req.json();
      await schema.parseAsync(jsonData);
      await next();
    } catch (error: any) {
      const errors = ValidationError(error);
      return ApiResponse(c, 400, "Validation error!", null, errors);
    }
  };

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    password: z.string(),
  })
  .refine((data) => data.email || data.username, {
    message: "Email or Username required!",
    path: ["email", "username"],
  });

const profileSchema = z.object({
  name: z.string().min(3).max(30),
  username: z.string().min(3).max(15),
  gender: z.enum(["Male", "Female"]),
  bio: z.string(),
});

const passwordSchema = z.object({
  old_password: z.string(),
  new_password: z.string().min(6),
});

export {
  validateSchema,
  registerSchema,
  loginSchema,
  profileSchema,
  passwordSchema,
};
