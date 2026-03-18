import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkout, polar, portal } from "@polar-sh/better-auth";
import { env } from "@/lib/env";

const buildPolarPlugin = () => {
  if (!env.polarAccessToken) {
    return [];
  }

  const polarClient = new Polar({
    accessToken: env.polarAccessToken,
    server: env.polarServer === "production" ? "production" : "sandbox",
  });

  return [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: env.polarProProductId
            ? [{ productId: env.polarProProductId, slug: "pro" }]
            : undefined,
          successUrl: "/billing/success?checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }),
  ];
};

export const auth = betterAuth({
  baseURL: env.betterAuthUrl,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [...buildPolarPlugin()],
});

export const authHandler = toNextJsHandler(auth);
