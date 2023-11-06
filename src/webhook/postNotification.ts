import { SlackAPI } from "slack";

import getActualGraph from "./getActualGraph.ts";
import { renderActionLog, renderNotification } from "./renderers.tsx";
import type { KeyValueStore, WebhookContext } from "./types.ts";

const EVENT_TYPE = "PullRequest-Handler";

type SlackMessage = {
  metadata: {
    event_type: string;
    event_payload: {
      owner: string;
      name: string;
      number: number;
    };
  };
  ts: string;
};

async function findPreviousMessage(
  args: {
    slackToken: string;
    slackChannel: string;
    owner: string;
    name: string;
    number: number;
  },
): Promise<string | null> {
  const client = SlackAPI(args.slackToken);
  const result = await client.conversations.history({
    channel: args.slackChannel,
    include_all_metadata: true,
    limit: 100,
  });

  if (result.ok && Array.isArray(result.messages)) {
    for (const message of result.messages) {
      if ("metadata" in message) {
        const withMetadata = message as SlackMessage;
        if (withMetadata.metadata.event_type === EVENT_TYPE) {
          const actual = withMetadata.metadata.event_payload;
          if (
            actual.owner === args.owner && actual.name === args.name &&
            actual.number === args.number
          ) {
            return withMetadata.ts;
          }
        }
      }
    }
  }
  return null;
}

async function upsertMessage(
  args: {
    slackToken: string;
    slackChannel: string;
    owner: string;
    name: string;
    number: number;
    notification: boolean;
    // deno-lint-ignore no-explicit-any
    blocks: any;
    ts: string | null;
  },
) {
  const payload = {
    channel: args.slackChannel,
    blocks: args.blocks,
    text: EVENT_TYPE,
  };
  const metadata = {
    event_type: EVENT_TYPE,
    event_payload: {
      owner: args.owner,
      name: args.name,
      number: args.number,
    },
  };

  const client = SlackAPI(args.slackToken);
  if (args.ts) {
    if (args.notification) {
      return await client.chat.update({ ...payload, metadata, ts: args.ts });
    }
    return await client.chat.postMessage({ ...payload, thread_ts: args.ts });
  }
  return await client.chat.postMessage({ ...payload, metadata });
}

export default async function (
  githubToken: string,
  slackToken: string,
  slackChannel: string,
  userAccountMap: KeyValueStore<string>,
  webhookContext: WebhookContext,
) {
  const args = {
    githubToken,
    slackToken,
    slackChannel,
    owner: webhookContext.repository.owner.login,
    name: webhookContext.repository.name,
    number: webhookContext.number,
  };

  // ActualGraph
  const actualGraph = await getActualGraph(args);

  // PreviousTS
  const previousTS = await findPreviousMessage(args);

  if (
    !previousTS &&
    !["review_request_removed", "review_requested", "submitted"].includes(
      webhookContext.action,
    )
  ) {
    return;
  }

  const renderModel = { ...webhookContext, userAccountMap, ...actualGraph };

  // Notification
  const result = await upsertMessage({
    ...args,
    notification: true,
    blocks: renderNotification(renderModel),
    ts: previousTS,
  });
  if (!result.ok) {
    console.log({ result });
    return;
  }

  // ActionLog
  const actionLog = renderActionLog(renderModel);
  if (actionLog) {
    await upsertMessage({
      ...args,
      notification: false,
      blocks: actionLog,
      ts: result.ts,
    });
  }
}
