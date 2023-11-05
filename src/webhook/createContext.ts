import type {
  PullRequestEvent,
  PullRequestReviewEvent,
} from "webhooks-types";
import type { GitHubUser, Review, WebhookContext } from "./types.ts";

// deno-lint-ignore no-explicit-any
export default function (payload: any): WebhookContext | null {
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
