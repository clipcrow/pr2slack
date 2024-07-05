import {
  Blocks,
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

export function renderRepositoryMappingForm(
  props: { items: RepositoryMapping[]; slackChannel: string | undefined },
) {
  const fields = props.items.map((value) => {
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
    <Blocks>
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
        value={props.slackChannel}
        required
      />
      <Divider />
      {fields}
    </Blocks>,
  );
}

export function renderUserAccountMappingForm(
  props: { items: UserAccountMapping[]; slackAccount: string | undefined },
) {
  const fields = props.items.map((value) => {
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
    <Blocks>
      <Input
        label="GitHub Account"
        blockId="githubAccount"
        name="state"
        type="text"
        required
      />
      <UsersSelect
        label="Slack Account"
        blockId="slackAccount"
        name="state"
        value={props.slackAccount}
        required
      />
      <Divider />
      {fields}
    </Blocks>,
  );
}
