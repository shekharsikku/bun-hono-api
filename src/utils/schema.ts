import type { Context, Next } from "hono";
import { z, ZodSchema, ZodError } from "zod";
import { ApiResponse } from "~/utils";

const ValidationError = (
  error: ZodError
): { path: string; message: string }[] => {
  return error.errors.map((err) => ({
    path: err.path.join(", "),
    message: err.message,
  }));
};

const validateSchema =
  (schema: ZodSchema) => async (ctx: Context, next: Next) => {
    try {
      const jsonData = await ctx.req.json();
      const parsedData = schema.parse(jsonData);
      ctx.set("validated", parsedData);
      await next();
    } catch (error: any) {
      const errors = ValidationError(error);
      return ApiResponse(ctx, 400, "Validation Error!", null, errors);
    }
  };

const signUpSchema = z.object({
  email: z.string().email({ message: "Invalid email address!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
      message:
        "Password must have an uppercase, a lowercase letter, and a number!",
    })
    .refine((val) => !/\s/.test(val), {
      message: "Password cannot contain spaces!",
    }),
});

const signInSchema = z
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
  username: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-z0-9_-]{3,15}$/, {
      message:
        "Only lowercase letters, numbers, hyphens, and underscores are allowed, with no spaces or special characters at the start/end!",
    }),
  gender: z.enum(["Male", "Female", "Other"]),
  bio: z.string(),
});

const passwordSchema = z.object({
  old_password: z.string(),
  new_password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/, {
      message:
        "Password must have an uppercase, a lowercase letter, and a number!",
    })
    .refine((val) => !/\s/.test(val), {
      message: "Password cannot contain spaces!",
    }),
});

const messageSchema = z
  .object({
    type: z.enum(["text", "file"]),
    text: z.string().optional(),
    file: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "text") return !!data.text;
      if (data.type === "file") return !!data.file;
      return true;
    },
    {
      message:
        "Text is required if type is 'text', and File is required if type is 'file'",
      path: ["text", "file"],
    }
  );

export {
  validateSchema,
  signUpSchema,
  signInSchema,
  profileSchema,
  passwordSchema,
  messageSchema,
};
