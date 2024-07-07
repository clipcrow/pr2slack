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

/*
export type RepositoryMapping = {
  owner: string;
  repo: string;
  branch: string;
  slackChannel: string;
};
`https://github.com/${owner}/${repo}/tree/${branch}`
*/

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
    <Modal title="PR2Slack">
      <Input
        label="GitHub Repository Owner"
        blockId="repositoryOwner"
        name="state"
        type="text"
        required
      />
      <Input
        label="GitHub Repository Name"
        blockId="repositoryName"
        name="state"
        type="text"
        required
      />
      <Input
        label="Monitored BRANCH"
        blockId="branch"
        name="state"
        type="text"
        required
      />
      <ChannelsSelect
        label="Channel for notifying pull-requests"
        blockId="slackChannel"
        name="state"
        required
      />
      <Divider />
      {fields}
    </Modal>,
  );
}

export function renderUserAccountMappingForm(
  userAccountMap: KeyValueStore<string>,
  account: string = "",
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
    <Modal title="PR2Slack">
      <Input
        label="GitHub Account"
        blockId="githubAccount"
        name="state"
        type="text"
        value={account}
        required
      />
      <UsersSelect
        label="Slack Account"
        blockId="slackAccount"
        name="state"
        required
      />
      <Divider />
      {fields}
    </Modal>,
  );
}
