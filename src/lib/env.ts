import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required for connection pooling"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required for migrations"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required for Auth.js sessions"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:");
  _env.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  
  // We don't throw here to prevent Vercel build phases from failing if env vars aren't injected at build time,
  // but we loudly log the errors which will be visible in Vercel runtime logs.
}

export const env = _env.success ? _env.data : (process.env as any);

// Check production restrictions
if (process.env.NODE_ENV === "production") {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (!nextAuthUrl) {
    console.warn("⚠️ Warning: NEXTAUTH_URL is missing in production environment");
  } else if (nextAuthUrl.includes("localhost") || nextAuthUrl.includes("127.0.0.1")) {
    console.warn(`⚠️ Warning: Localhost URL (${nextAuthUrl}) detected in NEXTAUTH_URL for production! This must be set to the production domain (e.g. https://track-flow-omega.vercel.app).`);
  } else if (nextAuthUrl !== "https://track-flow-omega.vercel.app") {
     console.warn(`⚠️ Warning: NEXTAUTH_URL (${nextAuthUrl}) does not match expected production domain https://track-flow-omega.vercel.app`);
  }
}
