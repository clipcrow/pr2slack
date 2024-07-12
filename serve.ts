import { Application, Router } from "oak";
import { CSS, KATEX_CSS, render } from "gfm";
import { load } from "std/dotenv/mod.ts";
import type { KeyValueStore, WebhookContext } from "./types.ts";
import createContext from "./createContext.ts";
import postNotification from "./postNotification.ts";
import {
  openUserAccountMappingDialog,
  openUserAccountSettingDialog,
  updateUserAccountMappingDialog,
} from "./openDialog.ts";

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

const env = await load();

function getEnv(key: string): string {
  const value = Deno.env.get(key) || env[key];
  if (value) return value;
  throw `Env(${key}) Not Found.`;
}

const githubToken = getEnv("GITHUB_TOKEN");
const slackToken = getEnv("SLACK_TOKEN");
const slackChannel = getEnv("SLACK_CHANNEL");

function isWebhookContext(test: unknown): test is WebhookContext {
  return ((test as WebhookContext)?.action !== undefined &&
    typeof (test as WebhookContext).action === "string") &&
    ((test as WebhookContext)?.event !== undefined &&
      typeof (test as WebhookContext).event === "string") &&
    ((test as WebhookContext)?.number !== undefined &&
      typeof (test as WebhookContext).number === "number") &&
    ((test as WebhookContext)?.baseRef !== undefined &&
      typeof (test as WebhookContext).baseRef === "string");
}

const kv = await Deno.openKv();

const ACCOUNT = "account";

async function listAccountMapping() {
  const entries = kv.list<string>({ prefix: [ACCOUNT] });
  const result: KeyValueStore<string> = {};
  for await (const entry of entries) {
    result[entry.key[1] as string] = entry.value;
  }
  return result;
}

function setAccountMapping(githubAccount: string, slackAccount: string) {
  kv.set([ACCOUNT, githubAccount], slackAccount);
}

function deleteAccountMapping(githubAccount: string) {
  kv.delete([ACCOUNT, githubAccount]);
}

kv.listenQueue(async (cx) => {
  if (isWebhookContext(cx)) {
    const accountMapping = await listAccountMapping();
    await postNotification(
      githubToken,
      slackToken,
      slackChannel,
      accountMapping,
      cx,
    );
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
});

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

  if (payload.type === "block_actions") {
    const action = payload.actions[0];
    const id = `dialog_open_${action.value}`;
    if (action?.action_id === id && payload.trigger_id) {
      openUserAccountSettingDialog(
        slackToken,
        payload.trigger_id,
        action.value,
      );
      context.response.status = 200;
      return;
    }
    if (action?.action_id === "delete_account" && payload.view.id) {
      const githubAccount = action.value;
      deleteAccountMapping(githubAccount);
      const userAccountMap = await listAccountMapping();
      if (userAccountMap[githubAccount]) {
        // Suppress non-repeatable read
        delete userAccountMap[githubAccount];
      }
      updateUserAccountMappingDialog(
        slackToken,
        payload.view.id,
        userAccountMap,
      );
      context.response.status = 200;
      return;
    }
  }

  if (payload.type === "view_submission") {
    const form = payload.view?.state?.values;
    if (form && form.slackAccount) {
      const meta = JSON.parse(payload.view.private_metadata);
      if (meta?.githubAccount) {
        setAccountMapping(
          meta.githubAccount,
          form.slackAccount.state.selected_user,
        );
        context.response.status = 200;
        return;
      }
    }
  }

  console.log(
    `Have not reacted to "${payload.type}"`,
    "payload.actions:",
    payload.actions,
  );
});

router.post("/accountmap", async (context) => {
  const formData = await context.request.body.formData();
  const trigger_id = formData.get("trigger_id") as string;
  const userAccountMap = await listAccountMapping();
  if (trigger_id) {
    openUserAccountMappingDialog(
      slackToken,
      trigger_id,
      userAccountMap,
    );
    context.response.status = 200;
  }
});

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });
