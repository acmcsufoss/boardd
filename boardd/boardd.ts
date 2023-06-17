import type { Officer } from "../deps.ts";
import { createCodemod } from "../deps.ts";

/**
 * ACMCSUF_OWNER is the owner of the acmcsuf.com GitHub repository.
 */
export const ACMCSUF_OWNER = "EthanThatOneKid";

/**
 * ACMCSUF_REPO is the name of the acmcsuf.com GitHub repository.
 */
export const ACMCSUF_REPO = "acmcsuf.com";

/**
 * ACMCSUF_MAIN_BRANCH is the name of the main branch of the acmcsuf.com GitHub
 */
export const ACMCSUF_MAIN_BRANCH = "main";

/**
 * ACMCSUF_BOARDD_PATH is the path to the board data file.
 */
export const ACMCSUF_BOARDD_PATH = "src/lib/public/board/data/officers.json";

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
  let actorGitHubTag: string | undefined;

  // If pictureURL is not provided, download the picture.
  const pictureBlob = options.data.pictureURL
    ? await fetch(options.data.pictureURL).then((response) => response.blob())
    : undefined;
  let oldPicture: string | undefined;
  let newPicture: string | undefined;

  const apiOptions: Parameters<typeof createCodemod>[1] = {
    owner: ACMCSUF_OWNER,
    repo: ACMCSUF_REPO,
    token: options.githubPAT,
  };

  /**
   * stepOne is the first step of the boardd command. It creates a branch with
   * the updated JSON file.
   */
  async function stepOne() {
    return await createCodemod((codemod) =>
      codemod
        .createTree((tree) =>
          tree
            .baseRef(ref, ACMCSUF_MAIN_BRANCH)
            .text(ACMCSUF_BOARDD_PATH, (content) => {
              // Parse the officers.json file.
              const officers = JSON.parse(content) as Officer[];

              // Find the base officer.
              const [officer, officerIndex] = findOfficer(officers, target);
              if (!officer && !options.actor.isAdmin) {
                throw new Error(
                  "You can only create a new board member profile if you are an admin.",
                );
              }

              // Find the actor.
              const [actor] = findOfficer(officers, options.actor.tag);
              actorGitHubTag = actor?.socials?.github;

              // Patch the officer.
              fullName ??= officer?.fullName;
              if (fullName === undefined) {
                throw new Error("Full name cannot be undefined.");
              }

              newPicture = `${toSlug(fullName)}.webp`;
              oldPicture = officer?.picture;
              const socials: Officer["socials"] = {
                github: options.data.githubTag ?? officer?.socials?.github,
                linkedin: options.data.linkedinTag ??
                  officer?.socials?.linkedin,
                discord: target,
              };
              const positions: Officer["positions"] = officer?.positions ?? {};
              const newOfficer: Officer = {
                fullName,
                socials,
                positions,
              };

              // Update the officer's picture.
              if (pictureBlob) {
                newOfficer.picture = newPicture;
              }

              if (officer?.picture) {
                newOfficer.picture ||= officer.picture;
              }

              if (newOfficer.picture === "placeholder.webp") {
                delete newOfficer.picture;
              }

              // Keep the officer's legacy picture if the officer does not have
              // a picture.
              if (
                !pictureBlob &&
                officer?.legacyPicture &&
                newOfficer.legacyPicture !== "placeholder.webp"
              ) {
                newOfficer.legacyPicture = officer.legacyPicture;
              }

              // Update the officers array.
              if (!officer) {
                officers.push(newOfficer);
              } else {
                officers[officerIndex] = newOfficer;
              }

              // Return the new officers.json file content.
              return JSON.stringify(officers, null, 2) + "\n";
            })
        )
        .createCommit(({ 0: tree }) => ({
          message: `Update ${fullName}'s board member profile`,
          tree: tree.sha,
        }), (commit) => commit.parentRef(ref, ACMCSUF_MAIN_BRANCH))
        .createOrUpdateBranch(({ 1: commit }) => ({
          ref,
          sha: commit.sha,
        })), apiOptions);
  }

  /**
   * stepTwo is the second step of the boardd command. It uploads the new
   * picture and deletes the old one if it is different.
   */
  async function stepTwo() {
    if (!pictureBlob || !oldPicture) {
      return;
    }

    return await createCodemod((codemod) =>
      codemod
        .createTree((tree) => {
          if (pictureBlob) {
            tree
              .file(`static/assets/authors/${newPicture}`, pictureBlob);

            if (oldPicture !== newPicture) {
              tree
                .delete(`static/assets/authors/${oldPicture}`);
            }
          } else if (oldPicture !== newPicture) {
            tree
              .rename(
                `static/assets/authors/${oldPicture}`,
                `static/assets/authors/${newPicture}`,
              );
          }

          return tree.baseRef(ref);
        })
        .createCommit(({ 0: tree }) => ({
          message: `Upload ${fullName}'s board member profile picture`,
          tree: tree.sha,
        }), (commit) => commit.parentRef(ref))
        // TODO(https://oss.acmcsuf.com/codemod/issues/18): Update the current branch from main.
        .createOrUpdateBranch(({ 1: commit }) => ({
          ref,
          sha: commit.sha,
        })), apiOptions);
  }

  /**
   * stepThree is the third step of the boardd command. It creates a PR with the
   * changes.
   */
  async function stepThree() {
    return await createCodemod((codemod) =>
      codemod.maybeCreatePR({
        head: ref,
        base: ACMCSUF_MAIN_BRANCH,
        title: `[BOARDD] Update ${fullName}'s board member profile`,
        body: `This PR was created by ${
          actorGitHubTag
            ? `@${actorGitHubTag}`
            : options.actor.nick ?? `\`@${options.actor.tag}\``
        } using the \`boardd\` slash command. [_More info_](https://oss.acmcsuf.com/boardd#readme).`,
        draft: true,
      }), apiOptions);
  }

  // Run the steps.
  const result = await (
    stepOne()
      .then(stepTwo)
      .then(stepThree)
  );

  return { ref, number: result[0]?.number };
}

/**
 * findOfficer finds an officer by their Discord tag.
 */
export function findOfficer(
  officers: Officer[],
  tag: string,
): [undefined, -1] | [Officer, number] {
  const officerIndex = officers.findIndex((officer) => {
    const discriminatorIndex = officer.socials?.discord?.indexOf("#");
    const candidate = discriminatorIndex !== -1
      ? officer.socials?.discord?.slice(0, discriminatorIndex)
      : officer.socials?.discord;

    return candidate?.toLowerCase() === tag;
  });
  if (officerIndex === -1) {
    return [undefined, -1];
  }

  return [officers[officerIndex], officerIndex];
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
     * nick is the nickname of the actor.
     */
    nick?: string;

    /**
     * isAdmin is whether the actor is an admin or not.
     *
     * By default, this is false.
     */
    isAdmin?: boolean;
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
  ref: string;
  number?: number;
}
