import { SlackAPI } from "slack";
import { renderUserAccountMappingForm } from "./forms.tsx";

export default function (slackToken: string, trigger_id: string) {
  const client = SlackAPI(slackToken);
  client.views.open({
    trigger_id,
    view: renderUserAccountMappingForm([]),
  });
}
