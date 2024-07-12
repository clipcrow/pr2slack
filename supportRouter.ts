import { Router } from "oak";
import { CSS, KATEX_CSS, render } from "gfm";

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

export default function (
  router: Router,
  githubToken: string,
  slackToken: string,
) {
  router.get("/", async (context) => {
    context.response.body = await readme();
  });

  router.get("/env", (context) => {
    context.response.body = getHTML(
      `- GITHUB_TOKEN: ${githubToken.slice(0, 8)}...${
        githubToken.slice(-8)
      }\n` +
        `- SLACK_TOKEN: ${slackToken.slice(0, 8)}...${slackToken.slice(-8)}\n`,
    );
  });
}
