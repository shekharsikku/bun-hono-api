import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Context, TypedResponse } from "hono";

class ApiError extends Error {
  public code: ContentfulStatusCode;
  public message: string;

  constructor(code: ContentfulStatusCode, message: string, stack: string = "") {
    super(message);
    this.code = code;
    this.message = message;
    this.stack = stack;
  }
}

type Response = {
  code?: ContentfulStatusCode;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

const ApiResponse = (
  c: Context,
  code: ContentfulStatusCode,
  message: string,
  data: any = null,
  error: any = null
): TypedResponse<Response> => {
  const success: boolean = code < 400;
  const response: Response = { success, message };

  if (data) response.data = data;
  if (error) response.error = error;
  return c.json(response, code);
};

export { ApiError, ApiResponse };
