import { Router } from "oak";
import { CSS, render } from "gfm";
import handleWebhook from "./handleWebhook.ts";

async function readme() {
  const markdown = await Deno.readTextFile("README.md");
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


export default function () {
  const router = new Router();

  router.get("/", async (context) => {
    context.response.body = await readme();
  });

  router.get("/webhook", handleWebhook);

  return router;
}
