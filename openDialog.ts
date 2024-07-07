import { SlackAPI } from "slack";
import { renderUserAccountMappingForm } from "./forms.tsx";
import type { KeyValueStore } from "./types.ts";

export default function (
  slackToken: string,
  target: string,
  userAccountMap: KeyValueStore<string>,
  update: boolean,
  account: string = "",
) {
  const client = SlackAPI(slackToken);
  const view = renderUserAccountMappingForm(userAccountMap, account);
  if (update) {
    client.views.update({ view, view_id: target });
  } else {
    client.views.open({ view, trigger_id: target });
  }
}
