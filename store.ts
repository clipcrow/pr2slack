import type { KeyValueStore } from "./types.ts";

const kv = await Deno.openKv();

const ACCOUNT = "account";

export async function listAccountMapping() {
  const entries = kv.list<string>({ prefix: [ACCOUNT] });
  const result: KeyValueStore<string> = {};
  for await (const entry of entries) {
    result[entry.key[1] as string] = entry.value;
  }
  return result;
}

export function setAccountMapping(githubAccount: string, slackAccount: string) {
  kv.set([ACCOUNT, githubAccount], slackAccount);
}

export function deleteAccountMapping(githubAccount: string) {
  kv.delete([ACCOUNT, githubAccount]);
}

const REPOSITORY = "repository";

export async function listRepositoryMapping() {
  const entries = kv.list<string>({ prefix: [REPOSITORY] });
  const result: KeyValueStore<string> = {};
  for await (const entry of entries) {
    result[entry.key[1] as string] = entry.value;
  }
  return result;
}

export function setRepositoryMapping(url: string, slackChannel: string) {
  kv.set([REPOSITORY, url], slackChannel);
}

export function deleteRepositoryMapping(url: string) {
  kv.delete([REPOSITORY, url]);
}
