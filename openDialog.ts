import { SlackAPI } from "slack";
import {
  renderUserAccountMappingForm,
  renderUserAccountSettingForm,
} from "./forms.tsx";
import type { KeyValueStore } from "./types.ts";

export function openUserAccountMappingDialog(
  slackToken: string,
  target: string,
  userAccountMap: KeyValueStore<string>,
) {
  const client = SlackAPI(slackToken);
  const view = renderUserAccountMappingForm(userAccountMap);
  client.views.open({ view, trigger_id: target });
}

export function updateUserAccountMappingDialog(
  slackToken: string,
  target: string,
  userAccountMap: KeyValueStore<string>,
) {
  const client = SlackAPI(slackToken);
  const view = renderUserAccountMappingForm(userAccountMap);
  client.views.update({ view, view_id: target });
}

export function openUserAccountSettingDialog(
  slackToken: string,
  target: string,
  account: string,
) {
  const client = SlackAPI(slackToken);
  const view = renderUserAccountSettingForm(account);
  client.views.open({ view, trigger_id: target });
}
