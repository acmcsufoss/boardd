import { dotenv } from "./deps.ts";

const env = await dotenv.load();

/**
 * PORT is the port to listen on.
 */
export const PORT = parseInt(env.PORT || "8080");

/**
 * DEV is true if the application is running in development mode.
 */
export const DEV = env.DEV === "true";

if (!env.DISCORD_PUBLIC_KEY) {
  throw new Error("DISCORD_PUBLIC_KEY environment variable is required");
}

/**
 * DISCORD_PUBLIC_KEY is the Discord bot public key.
 */
export const DISCORD_PUBLIC_KEY = env.DISCORD_PUBLIC_KEY;

if (!env.DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_CLIENT_ID environment variable is required");
}

/**
 * DISCORD_CLIENT_ID is the Discord bot client ID.
 */
export const DISCORD_CLIENT_ID = env.DISCORD_CLIENT_ID;

if (!env.DISCORD_GUILD_ID) {
  throw new Error("DISCORD_GUILD_ID environment variable is required");
}

/**
 * DISCORD_GUILD_ID is the Discord guild ID.
 */
export const DISCORD_GUILD_ID = env.DISCORD_GUILD_ID;

if (!env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN environment variable is required");
}

/**
 * DISCORD_TOKEN is the Discord bot token.
 */
export const DISCORD_TOKEN = env.DISCORD_TOKEN;
