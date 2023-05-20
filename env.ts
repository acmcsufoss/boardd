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

if (!env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN environment variable is required");
}

/**
 * DISCORD_TOKEN is the Discord bot token.
 */
export const DISCORD_TOKEN = env.DISCORD_TOKEN;

if (!env.DISCORD_ROLE_ID) {
  throw new Error("DISCORD_ROLE_ID environment variable is required");
}

/**
 * DISCORD_ROLE_ID is the Discord role ID that is allowed to use the Boardd
 * application command. The command is intended to be used by board members.
 */
export const DISCORD_ROLE_ID = env.DISCORD_ROLE_ID;

if (!env.DISCORD_ADMIN_ROLES) {
  throw new Error("DISCORD_ADMIN_ROLES environment variable is required");
}

/**
 * DISCORD_ADMIN_ROLES is a comma-separated list of Discord role IDs that are
 * allowed to use the Boardd application command on any user.
 */
export const DISCORD_ADMIN_ROLES = env.DISCORD_ADMIN_ROLES.split(",");

if (!env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required");
}

/**
 * GITHUB_TOKEN is the GitHub personal access token.
 */
export const GITHUB_TOKEN = env.GITHUB_TOKEN;
