import { SlackAPI } from "slack";
import { renderUserAccountMappingForm } from "./forms.tsx";
import type { KeyValueStore } from "./types.ts";

export default function (
  slackToken: string,
  trigger_id: string,
  userAccountMap: KeyValueStore<string>,
) {
  const client = SlackAPI(slackToken);
  client.views.open({
    trigger_id,
    view: renderUserAccountMappingForm(userAccountMap),
  });
}
