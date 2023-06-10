import type { GitHubCodemodBuilderCreatePROptions, Officer } from "../deps.ts";
import { GitHubCodemodBuilder } from "../deps.ts";

/**
 * ACMCSUF_OWNER is the owner of the acmcsuf.com GitHub repository.
 */
export const ACMCSUF_OWNER = "EthanThatOneKid";

/**
 * ACMCSUF_REPO is the name of the acmcsuf.com GitHub repository.
 */
export const ACMCSUF_REPO = "acmcsuf.com";

async function customFetcher(
  url: Parameters<typeof fetch>[0],
  options?: Parameters<typeof fetch>[1],
): Promise<Response> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const bodyText = await response.text();
    console.error(`Error: ${response.status} ${response.statusText}`);
    console.error(`Response body: ${bodyText}`);
  }

  return response;
}

/**
 * boardd is the main function for the boardd command.
 */
export async function boardd(options: BoarddOptions): Promise<BoarddResult> {
  if (
    options.data.boardMemberTag !== options.actor.tag && !options.actor.isAdmin
  ) {
    throw new Error(
      "You can only update your own board member profile unless you are an admin.",
    );
  }

  if (options.data.fullName?.length === 0) {
    throw new Error("Full name cannot be empty.");
  }

  // Update officer data in new branch.
  const target = options.data.boardMemberTag ?? options.actor.tag;
  const ref = `boardd-${toSlug(target)}`;
  let fullName = options.data.fullName;

  // If pictureURL is not provided, download the picture.
  const pictureBlob = options.data.pictureURL
    ? await fetch(options.data.pictureURL).then((response) => response.blob())
    : undefined;

  // Steps:
  // 1. Create a branch with the updated JSON file. Check the old picture.
  // 2. If the picture is different, upload the new picture and delete the old one.
  // 3. Create a PR with the changes.

  const apiOptions: Parameters<typeof createCodemod>[1] = {
    owner: ACMCSUF_OWNER,
    repo: ACMCSUF_REPO,
    token: options.githubPAT,
  };

  const stepOne = await createCodemod((codemod) =>
    codemod
      .createTree((tree) =>
        tree
          .text("src/lib/public/board/data/officers.json", (content) => {
            // Parse the officers.json file.
            const officers = JSON.parse(content) as Officer[];

            // Find the officer.
            const officerIndex = officers.findIndex((officer) =>
              officer.socials?.discord === target
            );
            if (officerIndex === -1 && !options.actor.isAdmin) {
              throw new Error(
                "You can only create a new board member profile unless you are an admin.",
              );
            }

            // Patch the officer.
            const base = officerIndex !== -1
              ? officers[officerIndex]
              : undefined;
            fullName ??= base?.fullName;
            if (fullName === undefined) {
              throw new Error("Full name cannot be undefined.");
            }

            if (pictureBlob) {
              newPicture = `${toSlug(fullName)}.webp`;
              oldPicture = base?.picture;
            }
            const socials: Officer["socials"] = {
              github: options.data.githubTag ?? base?.socials?.github,
              linkedin: options.data.linkedinTag ?? base?.socials?.linkedin,
              discord: target,
            };
            const positions: Officer["positions"] = base?.positions ?? {};
            const officer: Officer = {
              fullName,
              socials,
              positions,
              picture: newPicture ?? base?.picture ?? "placeholder.webp",
            };

            // Update the officers array.
            if (officerIndex === -1) {
              officers.push(officer);
            } else {
              officers[officerIndex] = officer;
            }

            // Return the new officers.json file content.
            return JSON.stringify(officers, null, 2) + "\n";
          })
      )
      .createCommit(({ 0: tree }) => ({
        message: `Update ${fullName}'s board member profile`,
        tree: tree.sha,
      }))
      .createOrUpdateBranch(({ 1: commit }) => ({
        ref,
        sha: commit.sha,
      })), apiOptions);

  if (pictureBlob && oldPicture !== newPicture) {
    const stepTwo = await createCodemod((codemod) =>
      codemod
        .createTree((tree) =>
          tree
            .baseRef(ref)
        )
        .createCommit(({ 0: blob }) => ({
          message: `Upload ${fullName}'s board member profile picture`,
          content: blob.sha,
        }))
        .createOrUpdateBranch(({ 1: commit }) => ({
          ref: `boardd-${toSlug(target)}-picture`,
          sha: commit.sha,
        })), apiOptions);

    // const prNumber = results[2]?.number;
    // return { number: prNumber };

    /*
     // Delete old picture if unused.
  if (oldPicture && oldPicture !== newPicture) {
    pictureBuilder.delete(`static/assets/authors/${oldPicture}`);
  }

  // Add the new picture.
  pictureBuilder.setBlob(`static/assets/authors/${newPicture}`, pictureBlob);

  // Commit the picture and create a PR.
  const prResult = await pictureBuilder.createPR(prOptions);
  return { prNumber: prResult.pr.number };
  */
  }
}

/**
 * toChangelog converts the data to a changelog.
 */
export function toChangelog(data: BoarddOptions["data"]): string {
  const lines: string[] = [];
  if (data.fullName) {
    lines.push(`- **Full Name**: ${data.fullName}`);
  }

  if (data.pictureURL) {
    lines.push(`- **Picture**: ${data.pictureURL}`);
  }

  if (data.githubTag) {
    lines.push(`- **GitHub Tag**: ${data.githubTag}`);
  }

  if (data.discordTag) {
    lines.push(`- **Discord Tag**: ${data.discordTag}`);
  }

  if (data.linkedinTag) {
    lines.push(`- **LinkedIn Tag**: ${data.linkedinTag}`);
  }

  return lines.join("\n");
}

/**
 * toSlug converts the full name to a slug.
 *
 * See:
 * https://en.wikipedia.org/wiki/Slug_(web_publishing)
 */
export function toSlug(fullName: string): string {
  return fullName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}

/**
 * BoarddOptions are the options for the boardd function.
 */
export interface BoarddOptions {
  /**
   * githubPAT is the GitHub personal access token to use to authenticate with
   * the GitHub API.
   */
  githubPAT: string;

  /**
   * actor is the user who invoked the boardd command.
   */
  actor: {
    /**
     * tag is the Discord tag of the actor.
     */
    tag: string;

    /**
     * isAdmin is whether the actor is an admin or not.
     */
    isAdmin: boolean;
  };

  /**
   * data is the data to update the board member with.
   */
  data: {
    /**
     * fullName is the new full name of the board member.
     */
    fullName?: string;

    /**
     * pictureURL is the new picture URL of the board member.
     */
    pictureURL?: string;

    /**
     * githubTag is the new GitHub tag of the board member.
     */
    githubTag?: string;

    /**
     * discordTag is the new Discord tag of the board member.
     */
    discordTag?: string;

    /**
     * linkedinTag is the new LinkedIn tag of the board member.
     */
    linkedinTag?: string;

    /**
     * boardMemberTag is the Discord tag of the board member as stored in the
     * database. This is only used when updating a board member as an admin.
     */
    boardMemberTag?: string;
  };
}

/**
 * BoarddResult is the result of the boardd function.
 */
export interface BoarddResult {
  prNumber: number;
}
