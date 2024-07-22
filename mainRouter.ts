import { Router } from "oak";
import { listAccountMapping, listRepositoryMapping } from "./store.ts";
import createContext from "./createContext.ts";
import postNotification from "./postNotification.ts";

const kv = await Deno.openKv();

kv.listenQueue(async (payload) => {
  const { cx, slackToken, githubToken } = payload;
  const url = cx?.repository?.url;
  if (url && cx.baseRef && cx.number && slackToken && githubToken) {
    const repositoryMap = await listRepositoryMapping();
    const slackChannel = repositoryMap[`${url}/tree/${cx.baseRef}`];
    if (slackChannel) {
      const key = ["flag", url, cx.number];
      const kvResult = await kv.atomic()
        .check({ key, versionstamp: null })
        .set(key, true)
        .commit();
      if (!kvResult.ok) {
        throw `retry ${key}`;
      }
      try {
        const slackResult = await postNotification(
          slackToken,
          slackChannel,
          githubToken,
          await listAccountMapping(),
          cx,
        );
        if (slackResult && !slackResult.ok) {
          throw slackResult.error;
        }
      } finally {
        await kv.delete(key);
      }
    }
  }
});

export default function (
  router: Router,
  slackToken: string,
  githubToken: string,
) {
  router.post("/webhook", async (context) => {
    if (context.request.hasBody) {
      const cx = createContext(await context.request.body.json());
      if (cx) {
        await kv.enqueue(
          { cx, slackToken, githubToken },
          { backoffSchedule: [1000, 3000, 5000, 7500, 10000] },
        );
        context.response.status = 200;
      }
    }
  });
}
