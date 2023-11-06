import { Router } from "oak";
import createContext from "@/webhook/createContext.ts";
import postNotification from "@/webhook/postNotification.ts";
import readme from "@/web/readme.ts";

export default function() {
  const router = new Router();

  router.get("/", async (context) => {
    context.response.body = await readme();
  });

/*
  // settings
  const r1 = await client.apps.datastore.get({
    datastore: "repositoryMap",
    id: webhookContext.repository.url,
  });
  let branch = "";
  let slackChannel = "";
  if (r1.ok) {
    branch = r1.item["branch"];
    slackChannel = r1.item["slackChannel"];
  }

  const githubToken = env["githubToken"];

  const r2 = await client.apps.datastore.query({
    datastore: "userAccountMap",
  });
  let userAccountMap = {};
  if (r2.ok) {
    userAccountMap = r2.items.reduce((previous, value) => {
      return {
        ...previous,
        [value["githubAccount"]]: value["slackAccount"],
      };
    }, {});
  }
*/
  router.get("/webhook", async (context) => {
    try {
      // payload -> context
      const webhookContext = createContext(context.request.body);
      if (webhookContext === null) {
        return { outputs: {} };
      }
/*
      if (webhookContext.baseRef !== branch) {
        return { outputs: {} };
      }
    
      await postNotification(
        githubToken,
        token,
        slackChannel,
        userAccountMap,
        webhookContext,
      );
*/
      context.response.body = "OK";
    } catch (e) {
      context.response.status = 500;
      context.response.body = e;
    }
  });
  
  return router;
}