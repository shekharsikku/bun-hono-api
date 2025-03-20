import type { UserInterface, TokenInterface } from "@/interface";

declare module "hono" {
  interface HonoRequest {
    user?: UserInterface;
    token?: TokenInterface;
  }
}
