import { discord } from "../../deps.ts";

export const BOARDD = "boardd";
export const BOARDD_DESCRIPTION = "Manage acmcsuf.com board data.";

export const BOARDD_FULL_NAME = "full_name";
export const BOARDD_FULL_NAME_DESCRIPTION =
  "The full name of the board member.";

export const BOARDD_PICTURE = "picture";
export const BOARDD_PICTURE_DESCRIPTION =
  "The URL of the board member's picture.";

export const BOARDD_GITHUB_TAG = "github_tag";
export const BOARDD_GITHUB_TAG_DESCRIPTION =
  "The GitHub tag of the board member.";

export const BOARDD_DISCORD_TAG = "discord_tag";
export const BOARDD_DISCORD_TAG_DESCRIPTION =
  "The Discord tag of the board member.";

export const BOARDD_LINKEDIN_TAG = "linkedin_tag";
export const BOARDD_LINKEDIN_TAG_DESCRIPTION =
  "The LinkedIn tag of the board member.";

export const BOARDD_BOARD_MEMBER = "board_member";
export const BOARDD_BOARD_MEMBER_DESCRIPTION =
  "The user to add to the board. Only admins can update other users.";

/**
 * APP_BOARDD is the top-level command for the Boardd Application Command.
 */
export const APP_BOARDD: discord.RESTPostAPIApplicationCommandsJSONBody = {
  type: discord.ApplicationCommandType.ChatInput,
  name: BOARDD,
  description: BOARDD_DESCRIPTION,
  options: [
    {
      type: discord.ApplicationCommandOptionType.String,
      name: BOARDD_FULL_NAME,
      description: BOARDD_FULL_NAME_DESCRIPTION,
      required: false,
    },
    {
      type: discord.ApplicationCommandOptionType.String,
      name: BOARDD_PICTURE,
      description: BOARDD_PICTURE_DESCRIPTION,
      required: false,
    },
    {
      type: discord.ApplicationCommandOptionType.String,
      name: BOARDD_GITHUB_TAG,
      description: BOARDD_GITHUB_TAG_DESCRIPTION,
      required: false,
    },
    {
      type: discord.ApplicationCommandOptionType.String,
      name: BOARDD_DISCORD_TAG,
      description: BOARDD_DISCORD_TAG_DESCRIPTION,
      required: false,
    },
    {
      type: discord.ApplicationCommandOptionType.String,
      name: BOARDD_LINKEDIN_TAG,
      description: BOARDD_LINKEDIN_TAG_DESCRIPTION,
      required: false,
    },
    {
      type: discord.ApplicationCommandOptionType.User,
      name: BOARDD_BOARD_MEMBER,
      description: BOARDD_BOARD_MEMBER_DESCRIPTION,
      required: false,
    },
  ],
};
