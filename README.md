# pr2slack

This will notify pull-request events to your Slack channel.

## Requirements

Notify the pull request reviewer that a review request is coming, Notify the
pull request author as soon as the reviewer completes the approval.

- Post a message to Slack when a particular user is added as a reviewer to a
  pull request
- Update messages already posted at the following events
  - Yet another specific user is added as a reviewer
  - Reviewer completes review
  - Pull requests are merged
- The update history is threaded to the message
- Mention the Slack account of the target GitHub user

## How to implement

This system is designed to be hosted on Deno Deploy.

Posting to Slack uses the Slack Block API to create a dialog-like appearance.

Use Slack's metadata API to find messages to update. In this way, the channel is
not wasted. Fortunately, pull requests have a unique number, so I can simply use
that as my search key.

GraphQL(GitHub v4) was used as the method for acquiring detailed data of pull
request. It was very convenient because it took less effort than the REST
API(GitHub v3).

Store the bot tokens needed to use the Slack API in Deno Deploy Secrets. The
Slack channel ID, Slack and Github account pair, will be stored in Deno KV.

Holds tokens for operating GitHubtoo.

- serve.ts: The API server.
  - createContext.ts: Adjust the JSON of the received webhook.
  - postNotification.ts:
    - getActualGraph.ts: GraphQL
    - renderer.tsx: [jsx-slack](https://github.com/yhatt/jsx-slack)

## handle event of GitHub Actions

- Event > Activity Type
  - **pull_request**
    - opened
      - Even if a review request is made at the same time as the PR opens, the
        events will occur separately.
    - **closed**
      - When a pull request merges, the `pull_request` is automatically
        `closed`.
      - with a conditional that checks the `merged` value of the event. also
        `merged_by`.
    - edited
    - reopened
      - I don't know...
    - **review_requested**
      - see `payload.requested_reviewer`.
    - **review_request_removed**
      - see `payload.requested_reviewer`.
  - **pull_request_review**
    - **submitted**
      - when a pull request has been approved
      - check the `payload.review.state`, state == `approved` then PR was
        approved.
    - dismissed
      - Change the state of the review, but not the state of the PR.
  - pull_request_review_comment
    - created

## Call Slack API

- **chat.postMessage**
  - scope
    - `chat:write`
- **chat.update**
  - scope
    - `chat:write`
- **conversations.history**
  - scope
    - `channels:history`
    - `groups:history`
    - `im:history`
    - `mpim:history`
- Slash command
  - scope
    - `commands`

### .env file

The .env file is needed when running tests locally.

```yml
githubToken=ghp_abcdefghijklmnopqrstuvwxyz0123456789
slackToken=xoxb-1234567890123-1234567890123-abcdefghijklmnopqrstuvwx
slackChannel=C0123456789
```
