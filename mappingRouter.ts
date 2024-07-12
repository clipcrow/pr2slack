import { Router } from "oak";
import { SlackAPI } from "slack";
import {
  renderRepositoryMappingForm,
  renderUserAccountMappingForm,
  renderUserAccountSettingForm,
} from "./forms.tsx";
import {
  deleteAccountMapping,
  deleteRepositoryMapping,
  listAccountMapping,
  listRepositoryMapping,
  setAccountMapping,
  setRepositoryMapping,
} from "./store.ts";

export default function (router: Router, slackToken: string) {
  const slackClient = SlackAPI(slackToken);

  router.post("/action", async (context) => {
    const formData = await context.request.body.formData();
    const payload = JSON.parse(formData.get("payload") as string);

    if (payload.type === "block_actions") {
      const action = payload.actions[0];
      const id = `dialog_open_${action.value}`;
      if (action?.action_id === id && payload.trigger_id) {
        slackClient.views.open({
          view: renderUserAccountSettingForm(action.value),
          trigger_id: payload.trigger_id,
        });
        context.response.status = 200;
        return;
      }
      if (action?.action_id === "delete_account" && payload.view.id) {
        const githubAccount: string = action.value;
        deleteAccountMapping(githubAccount);
        const userAccountMap = await listAccountMapping();
        if (userAccountMap[githubAccount]) {
          // Suppress non-repeatable read
          delete userAccountMap[githubAccount];
        }
        slackClient.views.update({
          view: renderUserAccountMappingForm(userAccountMap),
          view_id: payload.view.id,
        });
        context.response.status = 200;
        return;
      }
      if (action?.action_id === "delete_repository" && payload.view.id) {
        const url: string = action.value;
        deleteRepositoryMapping(url);
        const repositoryMap = await listRepositoryMapping();
        if (repositoryMap[url]) {
          // Suppress non-repeatable read
          delete repositoryMap[url];
        }
        slackClient.views.update({
          view: renderRepositoryMappingForm(repositoryMap),
          view_id: payload.view.id,
        });
        context.response.status = 200;
        return;
      }
    }

    if (payload.type === "view_submission") {
      const slackAccount = payload.view?.state?.values?.slackAccount;
      if (slackAccount) {
        const githubAccount = payload.view?.state?.values?.githubAccount;
        const meta = JSON.parse(payload.view.private_metadata || "{}");
        const value = githubAccount?.state?.value || meta.githubAccount;
        if (value) {
          setAccountMapping(
            value,
            slackAccount.state.selected_user,
          );
          context.response.status = 200;
          return;
        }
      }

      const slackChannel = payload.view?.state?.values?.slackChannel;
      if (slackChannel) {
        const { owner, repo, branch } = payload.view?.state?.values;
        if (owner && repo && branch) {
          setRepositoryMapping(
            `https://github.com/${owner.state.value}/${repo.state.value}/tree/${branch.state.value}`,
            slackChannel.state.selected_channel,
          );
          context.response.status = 200;
          return;
        }
      }
    }

    console.log(
      `Have not reacted to "${payload.type}"`,
      "payload.actions:",
      payload.actions,
    );
  });

  router.post("/accountmap", async (context) => {
    const formData = await context.request.body.formData();
    const trigger_id = formData.get("trigger_id") as string;
    if (trigger_id) {
      const userAccountMap = await listAccountMapping();
      slackClient.views.open({
        view: renderUserAccountMappingForm(userAccountMap),
        trigger_id,
      });
      context.response.status = 200;
    }
  });

  router.post("/repositorymap", async (context) => {
    const formData = await context.request.body.formData();
    const trigger_id = formData.get("trigger_id") as string;
    if (trigger_id) {
      const repositoryMap = await listRepositoryMapping();
      slackClient.views.open({
        view: renderRepositoryMappingForm(repositoryMap),
        trigger_id,
      });
      context.response.status = 200;
    }
  });
}
