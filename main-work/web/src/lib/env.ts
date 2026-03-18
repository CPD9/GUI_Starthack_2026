const required = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  betterAuthUrl:
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000/api/auth",
  nextPublicBetterAuthUrl:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000/api/auth",
  databaseUrl: process.env.DATABASE_URL,
  mongoDbUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017",
  openAiApiKey: process.env.OPENAI_API_KEY,
  uuidTranslationsPath: process.env.UUID_TRANSLATIONS_PATH,
  polarAccessToken: process.env.POLAR_ACCESS_TOKEN,
  polarWebhookSecret: process.env.POLAR_WEBHOOK_SECRET,
  polarServer: process.env.POLAR_SERVER ?? "sandbox",
  polarProProductId: process.env.POLAR_PRO_PRODUCT_ID,
};

export const requireEnv = {
  betterAuthUrl: () => required(process.env.BETTER_AUTH_URL, "BETTER_AUTH_URL"),
  nextPublicBetterAuthUrl: () =>
    required(
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
      "NEXT_PUBLIC_BETTER_AUTH_URL"
    ),
  databaseUrl: () => required(process.env.DATABASE_URL, "DATABASE_URL"),
};
