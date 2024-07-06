import {
  Modal,
  Button,
  ChannelsSelect,
  Divider,
  Field,
  Input,
  JSXSlack,
  Mrkdwn,
  Section,
  UsersSelect,
} from "jsx-slack";

export type RepositoryMapping = {
  repositoryURL: string;
  branch: string;
  slackChannel: string;
};

export type UserAccountMapping = {
  githubAccount: string;
  slackAccount: string;
};

export function renderRepositoryMappingForm(items: RepositoryMapping[]) {
  const fields = items.map((value) => {
    return (
      <Section>
        <Field>
          <Mrkdwn>{value.repositoryURL}/tree/{value.branch}</Mrkdwn>
        </Field>
        <Field>
          <Mrkdwn raw verbatim>{`<#${value.slackChannel}>`}</Mrkdwn>
        </Field>
        <Button
          style="danger"
          name="deleteMapping"
          value={value.repositoryURL}
        >
          DELETE
        </Button>
      </Section>
    );
  });
  return JSXSlack(
    <Modal title="PR2Slack" >
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

export function renderUserAccountMappingForm(items: UserAccountMapping[]) {
  const fields = items.map((value) => {
    return (
      <Section>
        <Field>{value.githubAccount}</Field>
        <Field>
          <Mrkdwn raw verbatim>{`<@${value.slackAccount}>`}</Mrkdwn>
        </Field>
        <Button
          style="danger"
          name="deleteMapping"
          value={value.githubAccount}
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
        value=""
        required
      />
      <UsersSelect
        label="Slack Account"
        blockId="slackAccount"
        name="state"
        value=""
        required
      />
      <Divider />
      {fields}
    </Modal>,
  );
}
