import { create, getNumericDate } from "djwt";
import { Context } from "oak";
import type { PullRequestEvent, PullRequestReviewEvent } from "webhooks-types";
import type { GitHubUser, Review, WebhookContext, ApplicationHook } from "./types.ts";
import postNotification from "./postNotification.ts";

const kv = await Deno.openKv();

function isApplicationHook(test: unknown): test is ApplicationHook {
  return (test as ApplicationHook).installation !== undefined;
}

async function getInstallationToken(
  gitHubAppID: string,
  privateKey: CryptoKey,
  installationID: number,
) {
  const now = Date.now();
  const jwt = await create(
    {
      alg: "RS256",
    },
    {
      iat: getNumericDate(now - 60),
      exp: getNumericDate(now + 10 * 60),
      iss: gitHubAppID,
    },
    privateKey,
  );

  const response = await fetch(
    `https://api.github.com/app/installations/${installationID}/access_tokens`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.statusText}`);
  }
  return await response.json();
}

// deno-lint-ignore no-explicit-any
function createContext(payload: any): WebhookContext | null {
  const pullRequestEvent = payload as PullRequestEvent;
  const { sender, action, repository, pull_request } = pullRequestEvent;

  if (
    sender === undefined || action === undefined ||
    repository === undefined || pull_request === undefined
  ) {
    return null;
  }

  let requestedReviewer: GitHubUser | undefined;
  const { requested_reviewer, requested_team } = payload;
  if (requested_reviewer !== undefined) {
    requestedReviewer = {
      login: requested_reviewer.login,
      url: requested_reviewer.html_url,
    };
  } else if (requested_team !== undefined) {
    requestedReviewer = {
      login: requested_team.name,
      url: requested_team.html_url,
    };
  }

  const pullRequestReviewEvent = payload as PullRequestReviewEvent;
  const { review: origin } = pullRequestReviewEvent;

  let review: Review | undefined;
  let event = "pull_request";
  if (origin !== undefined) {
    review = {
      author: {
        login: origin.user.login,
        url: origin.user.html_url,
      },
      body: origin.body,
      state: origin.state.toUpperCase(),
      updatedAt: origin.submitted_at,
    };
    event = "pull_request_review";
  }

  const webhookContext: WebhookContext = {
    sender: {
      login: sender.login,
      url: sender.html_url,
    },
    event,
    action,
    repository: {
      owner: {
        login: repository.owner.login,
        url: repository.owner.html_url,
      },
      name: repository.name,
      url: repository.html_url,
    },
    number: pull_request.number,
    baseRef: pull_request.base.ref,
    requestedReviewer,
    review,
  };

  console.log({ webhookContext });
  return webhookContext;
}

export default async function (context: Context) {
  const json = context.request.body;
  if (isApplicationHook(json)) {

  }
}
