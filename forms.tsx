import {
  Button,
  ChannelsSelect,
  Divider,
  Field,
  Input,
  JSXSlack,
  Modal,
  Mrkdwn,
  Section,
  UsersSelect,
} from "jsx-slack";
import type { KeyValueStore } from "./types.ts";

export function renderUserAccountMappingForm(
  userAccountMap: KeyValueStore<string>,
) {
  const fields = Object.keys(userAccountMap).map((githubAccount) => {
    const slackAccount = userAccountMap[githubAccount];
    if (!slackAccount) return null;
    return (
      <Section>
        <Field>{githubAccount}</Field>
        <Field>
          <Mrkdwn raw verbatim>{`<@${slackAccount}>`}</Mrkdwn>
        </Field>
        <Button
          style="danger"
          name="delete_account"
          value={githubAccount}
        >
          DELETE
        </Button>
      </Section>
    );
  });
  return JSXSlack(
    <Modal title="Link Slack account">
      <Input
        label="GitHub Account"
        blockId="githubAccount"
        name="state"
        type="text"
        value=""
        placeholder="Write a GitHub user-name"
        required
      />
      <UsersSelect
        label="Slack Account"
        blockId="slackAccount"
        name="state"
        value=""
        placeholder="Select a Slack account"
        required
      />
      <Divider />
      {fields}
    </Modal>,
  );
}

export function renderUserAccountSettingForm(account: string) {
  return JSXSlack(
    <Modal title="Link a Slack account">
      <Section>
        <b>GitHub Account</b>
        <pre>{account}</pre>
      </Section>
      <input name="githubAccount" type="hidden" value={account} />
      <UsersSelect
        label="Slack Account"
        blockId="slackAccount"
        name="state"
        placeholder="Select a Slack account"
        required
      />
    </Modal>,
  );
}

export function renderRepositoryMappingForm(
  repositoryMap: KeyValueStore<string>,
) {
  const fields = Object.keys(repositoryMap).map((url) => {
    const slackChannel = repositoryMap[url];
    if (!slackChannel) return null;
    return (
      <Section>
        <Field>
          <Mrkdwn>{url}</Mrkdwn>
        </Field>
        <Field>
          <Mrkdwn raw verbatim>{`<#${slackChannel}>`}</Mrkdwn>
        </Field>
        <Button
          style="danger"
          name="delete_repository"
          value={url}
        >
          DELETE
        </Button>
      </Section>
    );
  });
  return JSXSlack(
    <Modal title="Link Slack channel">
      <Input
        label="GitHub Repository Owner"
        blockId="owner"
        name="state"
        type="text"
        placeholder="Write an owner name"
        required
      />
      <Input
        label="GitHub Repository Name"
        blockId="repo"
        name="state"
        type="text"
        placeholder="Write a repository name"
        required
      />
      <Input
        label="Monitored BRANCH"
        blockId="branch"
        name="state"
        type="text"
        placeholder="Write a branch name"
        required
      />
      <ChannelsSelect
        label="Channel for notifying pull-requests"
        blockId="slackChannel"
        name="state"
        placeholder="Select a Slack channel"
        required
      />
      <Divider />
      {fields}
    </Modal>,
  );
}
