// Run:
// deno run -A main.ts
//

import { discord } from "./deps.ts";
import { DiscordAPIClient, verify } from "./bot/discord/mod.ts";
import {
  APP_BOARDD,
  BOARDD_BOARD_MEMBER,
  BOARDD_DISCORD_TAG,
  BOARDD_FULL_NAME,
  BOARDD_GITHUB_TAG,
  BOARDD_LINKEDIN_TAG,
  BOARDD_PICTURE,
} from "./bot/app/mod.ts";
import type { BoarddOptions } from "./boardd/mod.ts";
import { boardd } from "./boardd/mod.ts";
import * as env from "./env.ts";

const api = new DiscordAPIClient();

if (import.meta.main) {
  await main();
}

export async function main() {
  // Overwrite the Discord Application Command.
  await api.registerCommand({
    app: APP_BOARDD,
    botID: env.DISCORD_CLIENT_ID,
    botToken: env.DISCORD_TOKEN,
  });

  console.log(
    "Invite Boardd to your server:",
    `https://discord.com/api/oauth2/authorize?client_id=${env.DISCORD_CLIENT_ID}&scope=applications.commands`,
  );

  console.log(
    "Discord application information:",
    `https://discord.com/developers/applications/${env.DISCORD_CLIENT_ID}/bot`,
  );

  // Start the server.
  Deno.serve({ port: env.PORT }, handle);
}

/**
 * handle is the HTTP handler for the Boardd application command.
 */
export async function handle(request: Request): Promise<Response> {
  const { error, body } = await verify(request, env.DISCORD_PUBLIC_KEY);
  if (error !== null) {
    return error;
  }

  // Parse the incoming request as JSON.
  const interaction = await JSON.parse(body) as discord.APIInteraction;
  switch (interaction.type) {
    case discord.InteractionType.Ping: {
      return Response.json({ type: discord.InteractionResponseType.Pong });
    }

    case discord.InteractionType.ApplicationCommand: {
      if (
        !discord.Utils.isChatInputApplicationCommandInteraction(interaction)
      ) {
        return new Response("Invalid request", { status: 400 });
      }

      if (!interaction.member?.user) {
        return new Response("Invalid request", { status: 400 });
      }

      if (
        !interaction.member.roles
          .some((role) => env.DISCORD_BOARD_ROLES.includes(role))
      ) {
        return new Response("Invalid request", { status: 400 });
      }

      // Make the Boardd options.
      const options = makeBoarddOptions(
        interaction.member,
        interaction.data,
        env.DISCORD_ADMIN_ROLES,
      );

      // Invoke the Boardd operation.
      boardd(options)
        .then((result) =>
          api.editOriginalInteractionResponse({
            botID: env.DISCORD_CLIENT_ID,
            botToken: env.DISCORD_TOKEN,
            interactionToken: interaction.token,
            content: result.number === undefined
              ? `Successfully updated [\`${result.ref}\`](https://acmcsuf.com/code/tree/${result.ref})!`
              : `Successfully created <https://acmcsuf.com/pull/${result.number}>!`,
          })
        )
        .catch((error) => {
          if (error instanceof Error) {
            api.editOriginalInteractionResponse({
              botID: env.DISCORD_CLIENT_ID,
              botToken: env.DISCORD_TOKEN,
              interactionToken: interaction.token,
              content: error.message,
            });
          }

          console.error(error);
        });

      // Acknowledge the interaction.
      return Response.json(
        {
          type:
            discord.InteractionResponseType.DeferredChannelMessageWithSource,
          data: {
            flags: discord.MessageFlags.Ephemeral,
          },
        } satisfies discord.APIInteractionResponseDeferredChannelMessageWithSource,
      );
    }

    default: {
      return new Response("Invalid request", { status: 400 });
    }
  }
}

/**
 * makeBoarddOptions makes the Boardd options from the Discord interaction.
 */
export function makeBoarddOptions(
  member: discord.APIInteractionGuildMember,
  data: discord.APIChatInputApplicationCommandInteractionData,
  adminRoleIDs: string[],
): BoarddOptions {
  const options: BoarddOptions = {
    githubPAT: env.GITHUB_TOKEN,
    actor: {
      tag: member.user.username,
      nick: member.nick ?? undefined,
      isAdmin: member.roles
        .some((role) => adminRoleIDs.includes(role)),
    },
    data: {},
  };

  const fullNameInput = data.options
    ?.find((option) => option.name === BOARDD_FULL_NAME);
  if (fullNameInput?.type === discord.ApplicationCommandOptionType.String) {
    options.data.fullName = fullNameInput.value;
  }

  const pictureURLInput = data.options
    ?.find((option) => option.name === BOARDD_PICTURE);
  if (
    pictureURLInput?.type === discord.ApplicationCommandOptionType.String
  ) {
    options.data.pictureURL = pictureURLInput.value;
  }

  const githubTagInput = data.options
    ?.find((option) => option.name === BOARDD_GITHUB_TAG);
  if (
    githubTagInput?.type === discord.ApplicationCommandOptionType.String
  ) {
    options.data.githubTag = githubTagInput.value;
  }

  const discordTagInput = data.options
    ?.find((option) => option.name === BOARDD_DISCORD_TAG);
  if (
    discordTagInput?.type === discord.ApplicationCommandOptionType.String
  ) {
    options.data.discordTag = discordTagInput.value;
  }

  const linkedinTagInput = data.options
    ?.find((option) => option.name === BOARDD_LINKEDIN_TAG);
  if (
    linkedinTagInput?.type === discord.ApplicationCommandOptionType.String
  ) {
    options.data.linkedinTag = linkedinTagInput.value;
  }

  const boardMemberTagInput = data.options
    ?.find((option) => option.name === BOARDD_BOARD_MEMBER);
  if (
    boardMemberTagInput?.type === discord.ApplicationCommandOptionType.User
  ) {
    options.data.boardMemberTag = boardMemberTagInput.value;
  }

  return options;
}
