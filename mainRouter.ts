import { Router } from "oak";
import { listAccountMapping, listRepositoryMapping } from "./store.ts";
import createContext from "./createContext.ts";
import postNotification from "./postNotification.ts";

const kv = await Deno.openKv();

kv.listenQueue(async (payload) => {
  if (payload.nonce) {
    const nonce = await kv.get(["nonces", payload.nonce]);
    if (nonce.value === null) {
      return;
    }
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
        await kv.atomic()
          .check({ key: nonce.key, versionstamp: nonce.versionstamp })
          .delete(nonce.key)
          .sum(["processed_count"], 1n)
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
        const nonce = crypto.randomUUID();
        await kv.atomic()
          .check({ key: ["nonces", nonce], versionstamp: null })
          .enqueue({ nonce, cx, githubToken, slackToken })
          .set(["nonces", nonce], true)
          .sum(["enqueued_count"], 1n)
          .commit();
        context.response.status = 200;
      }
    }
  });
}
