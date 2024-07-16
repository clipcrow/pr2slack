import { Router } from "oak";
import { delay } from "std/async";
import { listAccountMapping, listRepositoryMapping } from "./store.ts";
import createContext from "./createContext.ts";
import postNotification from "./postNotification.ts";

const kv = await Deno.openKv();

kv.listenQueue(async (payload) => {
  const { cx, githubToken, slackToken } = payload;
  if (cx?.repository?.url && cx.baseRef && githubToken && slackToken) {
    const repositoryMap = await listRepositoryMapping();
    const url = `${cx.repository.url}/tree/${cx.baseRef}`;
    const slackChannel = repositoryMap[url];
    if (slackChannel) {
      await postNotification(
        githubToken,
        slackToken,
        slackChannel,
        await listAccountMapping(),
        cx,
      );
      await delay(1000);
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
        kv.enqueue({ cx, githubToken, slackToken });
        context.response.status = 200;
      }
    }
  });
}
