import type { UserInterface, TokenInterface } from "@/interface";

declare module "hono" {
  interface ContextVariableMap {
    user?: UserInterface;
    token?: TokenInterface;
  }
}
