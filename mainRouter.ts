import { Router } from "oak";
import { delay } from "std/async";
import { listAccountMapping, listRepositoryMapping } from "./store.ts";
import createContext from "./createContext.ts";
import postNotification from "./postNotification.ts";
import type { WebhookContext } from "./types.ts";

const kv = await Deno.openKv();

function getKeyFromContext(cx: WebhookContext): Deno.KvKey {
  const owner = cx.repository.owner.login;
  const name = cx.repository.name;
  const number = cx.number;
  return ["pull_request", owner, name, number];
}

kv.listenQueue(async (payload) => {
  const { cx, githubToken, slackToken } = payload;
  const url = cx?.repository?.url;
  if (url && cx.baseRef && githubToken && slackToken) {
    const repositoryMap = await listRepositoryMapping();
    const slackChannel = repositoryMap[`${url}/tree/${cx.baseRef}`];
    if (slackChannel) {
      const key = getKeyFromContext(cx);
      const result = await kv.atomic()
        .check({ key, versionstamp: null })
        .set(key, true)
        .commit();
      if (result.ok) {
        await postNotification(
          githubToken,
          slackToken,
          slackChannel,
          await listAccountMapping(),
          cx,
        );
        await delay(1000);
        await kv.atomic()
          .check({ key, versionstamp: result.versionstamp })
          .delete(key)
          .commit();
      }
    }
  }
});

export default function (
  router: Router,
  githubToken: string,
  slackToken: string,
) {
  router.post("/webhook", async (context) => {
    if (context.request.hasBody) {
      const cx = createContext(await context.request.body.json());
      if (cx) {
        await kv.enqueue({ cx, githubToken, slackToken });
        context.response.status = 200;
      }
    }
  });
}
