import { Router } from "oak";
import readme from "./readme.ts";
import { handleWebhook } from "./engine.ts";

export default function () {
  const router = new Router();

  router.get("/", async (context) => {
    context.response.body = await readme();
  });

  router.get("/webhook", handleWebhook);

  return router;
}
