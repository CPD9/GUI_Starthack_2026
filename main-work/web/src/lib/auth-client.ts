import { polarClient } from "@polar-sh/better-auth/client";
import { createAuthClient } from "better-auth/react";
import { env } from "@/lib/env";

export const authClient = createAuthClient({
  baseURL: env.nextPublicBetterAuthUrl,
  plugins: [polarClient()],
});
