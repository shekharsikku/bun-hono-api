import type { StatusCode } from "hono/utils/http-status";
import type { Context, TypedResponse } from "hono";

class ApiError extends Error {
  public code: StatusCode;
  public message: string;

  constructor(code: StatusCode, message: string, stack: string = "") {
    super(message);
    this.code = code;
    this.message = message;
    this.stack = stack;
  }
}

type Response = {
  code: StatusCode;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
};

const ApiResponse = (
  c: Context,
  code: StatusCode,
  message: string,
  data: any = null,
  error: any = null
): TypedResponse<Response> => {
  const success: boolean = code < 400 ? true : false;
  const response: Response = { code, success, message };

  if (data) response.data = data;
  if (error) response.error = error;
  return c.json(response, code);
};

export { ApiError, ApiResponse };
