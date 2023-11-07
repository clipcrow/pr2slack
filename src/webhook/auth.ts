import { create, getNumericDate } from "djwt";
import type { ApplicationHook } from "./types.ts";

export function isApplicationHook(test: unknown): test is ApplicationHook {
  return (test as ApplicationHook).installation !== undefined;
}

export async function getInstallationToken (
  gitHubAppID: string,
  privateKey: CryptoKey,
  installationID: number,
) {
  const now = Date.now();
  const jwt = await create(
    {
      alg: "RS256",
    },
    {
      iat: getNumericDate(now - 60),
      exp: getNumericDate(now + 10 * 60),
      iss: gitHubAppID,
    },
    privateKey,
  );

  const response = await fetch(
    `https://api.github.com/app/installations/${installationID}/access_tokens`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Fetch error: ${response.statusText}`);
  }
  return await response.json();
}
