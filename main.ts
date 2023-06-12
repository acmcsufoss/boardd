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
import { doNgrok } from "./ngrok.ts";
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

  // In development mode, we use ngrok to expose the server to the Internet.
  if (env.DEV) {
    doNgrok().then((url) => {
      console.log("Interactions endpoint URL:", url);
    });
  }

  // Start the server.
  const server = Deno.listen({ port: env.PORT });
  for await (const conn of server) {
    serveHttp(conn);
  }
}

async function serveHttp(conn: Deno.Conn) {
  const httpConn = Deno.serveHttp(conn);
  for await (const requestEvent of httpConn) {
    const response = await handle(requestEvent.request);
    requestEvent.respondWith(response);
  }
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

      if (!interaction.member.roles.includes(env.DISCORD_ROLE_ID)) {
        return new Response("Invalid request", { status: 400 });
      }

      // Make the Boardd options.
      const options: BoarddOptions = {
        githubPAT: env.GITHUB_TOKEN,
        actor: {
          tag:
            `${interaction.member.user.username}#${interaction.member.user.discriminator}`,
          isAdmin: interaction.member.roles.some((role) =>
            env.DISCORD_ADMIN_ROLES.includes(role)
          ),
        },
        data: {},
      };

      const fullNameInput = interaction.data.options?.find((option) =>
        option.name === BOARDD_FULL_NAME
      );
      if (fullNameInput?.type === discord.ApplicationCommandOptionType.String) {
        options.data.fullName = fullNameInput.value;
      }

      const pictureURLInput = interaction.data.options?.find((option) =>
        option.name === BOARDD_PICTURE
      );
      if (
        pictureURLInput?.type === discord.ApplicationCommandOptionType.String
      ) {
        options.data.pictureURL = pictureURLInput.value;
      }

      const githubTagInput = interaction.data.options?.find((option) =>
        option.name === BOARDD_GITHUB_TAG
      );
      if (
        githubTagInput?.type === discord.ApplicationCommandOptionType.String
      ) {
        options.data.githubTag = githubTagInput.value;
      }

      const discordTagInput = interaction.data.options?.find((option) =>
        option.name === BOARDD_DISCORD_TAG
      );
      if (
        discordTagInput?.type === discord.ApplicationCommandOptionType.String
      ) {
        options.data.discordTag = discordTagInput.value;
      }

      const linkedinTagInput = interaction.data.options?.find((option) =>
        option.name === BOARDD_LINKEDIN_TAG
      );
      if (
        linkedinTagInput?.type === discord.ApplicationCommandOptionType.String
      ) {
        options.data.linkedinTag = linkedinTagInput.value;
      }

      const boardMemberTagInput = interaction.data.options?.find((option) =>
        option.name === BOARDD_BOARD_MEMBER
      );
      if (
        boardMemberTagInput?.type === discord.ApplicationCommandOptionType.User
      ) {
        options.data.boardMemberTag = boardMemberTagInput.value;
      }

      // Invoke the Boardd operation.
      boardd(options)
        .then((result) =>
          api.editOriginalInteractionResponse({
            botID: env.DISCORD_CLIENT_ID,
            botToken: env.DISCORD_TOKEN,
            interactionToken: interaction.token,
            content:
              `Successfully created <https://acmcsuf.com/pull/${result.prNumber}>!`,
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
