import { SlackAPI } from "slack";
import { renderUserAccountMappingForm } from "./forms.tsx";
import type { KeyValueStore } from "./types.ts";

export default function (
  slackToken: string,
  target: string,
  userAccountMap: KeyValueStore<string>,
  update: boolean,
) {
  const client = SlackAPI(slackToken);
  const view = renderUserAccountMappingForm(userAccountMap);
  if (update) {
    client.views.update({ view, trigger_id: target});
  } else {
    client.views.open({ view, view_id: target});
  }
}
