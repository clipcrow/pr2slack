import { Application, Router } from "oak";
import { CSS, KATEX_CSS, render } from "gfm";
import { load } from "std/dotenv/mod.ts";
import type { WebhookContext } from "./types.ts";
import createContext from "./createContext.ts";
import postNotification from "./postNotification.ts";
import openDialog from "./openDialog.ts";

const env = await load();

function getHTML(markdown: string) {
  const body = render(markdown);
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        main {
          max-width: 800px;
          margin: 0 auto;
        }
        ${CSS}
        ${KATEX_CSS}
      </style>
    </head>
    <body>
      <main data-color-mode="light" data-light-theme="light" data-dark-theme="dark" class="markdown-body">
        ${body}
      </main>
    </body>
  </html>
  `;
}

async function readme() {
  return getHTML(await Deno.readTextFile("README.md"));
}

function getEnv(key: string): string {
  return Deno.env.get(key) || env[key];
}

function isWebhookContext(test: unknown): test is WebhookContext {
  return test !== undefined;
}

const kv = await Deno.openKv();

const githubToken = getEnv("GITHUB_TOKEN");
const slackToken = getEnv("SLACK_TOKEN");
const slackChannel = getEnv("SLACK_CHANNEL");

kv.listenQueue(async (cx) => {
  if (isWebhookContext(cx)) {
    await postNotification(githubToken, slackToken, slackChannel, {}, cx);
  }
});

const router = new Router();

router.get("/", async (context) => {
  context.response.body = await readme();
});

router.get("/env", (context) => {
  context.response.body = getHTML(
    `- GITHUB_TOKEN: ${githubToken.slice(0, 8)}...${githubToken.slice(-8)}\n` +
    `- SLACK_TOKEN: ${slackToken.slice(0, 8)}...${slackToken.slice(-8)}\n` + 
    `- SLACK_CHANNEL: ${slackChannel}`,
  );
})

router.post("/webhook", async (context) => {
  if (context.request.hasBody) {
    const cx = createContext(await context.request.body.json());
    if (cx) {
      kv.enqueue(cx);
      context.response.status = 200;
    }
  }
});

router.post("/action", async (context) => {
  const formData = await context.request.body.formData();
  const payload = JSON.parse(formData.get("payload") as string);
  
  if (payload.type === "block_actions" && payload.trigger_id) {
    
    //KVから読み出し
    payload.message = undefined;
    console.log(payload);

    openDialog(slackToken, payload.trigger_id, []);
    context.response.status = 200;
  } else if (payload.type === "view_submission") {
    
    // KVに保存
    console.log(payload.view);
    payload.view = undefined;
    console.log(payload);

    context.response.body = { response_action: "clear" };
    context.response.status = 200;
  }
});

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });
