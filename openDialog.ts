import { SlackAPI } from "slack";
import { renderUserAccountMappingForm, UserAccountMapping } from "./forms.tsx";

export default function (slackToken: string, trigger_id: string, items: UserAccountMapping[]) {
  const client = SlackAPI(slackToken);
  client.views.open({
    trigger_id,
    view: renderUserAccountMappingForm(items),
  });
}
