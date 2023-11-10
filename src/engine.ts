import { Context } from "oak";
import createContext from "./createContext.ts";
import { getInstallationToken } from "./auth.ts";
import postNotification from "./postNotification.ts";
import type { ApplicationHook } from "./types.ts";

function isApplicationHook(test: unknown): test is ApplicationHook {
  return (test as ApplicationHook).installation !== undefined;
}

const kv = await Deno.openKv();

export async function handleWebhook(context: Context) {
  const json = context.request.body;
  if (isApplicationHook(json)) {
    json.id
  }
}