import { Application, Router } from "oak";
import { CSS, KATEX_CSS, render } from "gfm";
import { load } from "std/dotenv/mod.ts";
import type { WebhookContext } from "./types.ts";
import createContext from "./createContext.ts";
import postNotification from "./postNotification.ts";

const env = await load();

function getHTML(body: string) {
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
  const markdown = await Deno.readTextFile("README.md");
  return getHTML(render(markdown));
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
    `- GITHUB_TOKEN: ${githubToken.slice(0, 5)}...\n` +
    `- SLACK_TOKEN: ${slackToken.slice(0, 5)}...\n` + 
    `- SLACK_CHANNEL: ${slackChannel}`,
  );
})

router.get("/webhook", (context) => {
  const payload = context.request.body;
  const cx = createContext(payload);
  if (cx) {
    kv.enqueue(cx);
  }
});

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });
