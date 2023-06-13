import { dotenv } from "./deps.ts";

await dotenv.load({ export: true });

/**
 * PORT is the port to listen on.
 */
export const PORT = parseInt(Deno.env.get("PORT") || "8080");

const RAW_DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY");
if (!RAW_DISCORD_PUBLIC_KEY) {
  throw new Error("DISCORD_PUBLIC_KEY environment variable is required");
}

/**
 * DISCORD_PUBLIC_KEY is the Discord bot public key.
 */
export const DISCORD_PUBLIC_KEY = RAW_DISCORD_PUBLIC_KEY;

const RAW_DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID");
if (!RAW_DISCORD_CLIENT_ID) {
  throw new Error("DISCORD_CLIENT_ID environment variable is required");
}

/**
 * DISCORD_CLIENT_ID is the Discord bot client ID.
 */
export const DISCORD_CLIENT_ID = RAW_DISCORD_CLIENT_ID;

const RAW_DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN");
if (!RAW_DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN environment variable is required");
}

/**
 * DISCORD_TOKEN is the Discord bot token.
 */
export const DISCORD_TOKEN = RAW_DISCORD_TOKEN;

const RAW_DISCORD_ROLE_ID = Deno.env.get("DISCORD_ROLE_ID");
if (!RAW_DISCORD_ROLE_ID) {
  throw new Error("DISCORD_ROLE_ID environment variable is required");
}

/**
 * DISCORD_ROLE_ID is the Discord role ID that is allowed to use the Boardd
 * application command. The command is intended to be used by board members.
 */
export const DISCORD_ROLE_ID = RAW_DISCORD_ROLE_ID;

const RAW_DISCORD_ADMIN_ROLES = Deno.env.get("DISCORD_ADMIN_ROLES");
if (!RAW_DISCORD_ADMIN_ROLES) {
  throw new Error("DISCORD_ADMIN_ROLES environment variable is required");
}

/**
 * DISCORD_ADMIN_ROLES is a comma-separated list of Discord role IDs that are
 * allowed to use the Boardd application command on any user.
 */
export const DISCORD_ADMIN_ROLES = RAW_DISCORD_ADMIN_ROLES.split(",");

const RAW_GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
if (!RAW_GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN environment variable is required");
}

/**
 * GITHUB_TOKEN is the GitHub personal access token.
 */
export const GITHUB_TOKEN = RAW_GITHUB_TOKEN;
