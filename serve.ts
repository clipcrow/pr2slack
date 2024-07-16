import { Application, Router } from "oak";
import mainRouter from "./mainRouter.ts";
import supportRouter from "./supportRouter.ts";
import mappingRouter from "./mappingRouter.ts";

const githubToken = Deno.env.get("GITHUB_TOKEN");
const slackToken = Deno.env.get("SLACK_TOKEN");

if (githubToken && slackToken) {
  const router = new Router();
  mainRouter(router, githubToken, slackToken);
  supportRouter(router, githubToken, slackToken);
  mappingRouter(router, slackToken);

  const app = new Application();
  app.use(router.routes());
  app.use(router.allowedMethods());

  await app.listen({ port: 8080 });
} else {
  throw "Env Not Found";
}
