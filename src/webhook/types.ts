export type GitHubUser = {
  login: string;
  url: string;
};

export type ReviewRequest = {
  requestedReviewer: GitHubUser;
};

export type Review = {
  author: GitHubUser;
  body: string | null;
  state: string; // 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  updatedAt: string | null;
};
export type Connection<T> = {
  totalCount: number;
  edges: { node: T }[];
};

export type CheckRun = {
  name: string;
  conclusion: string;
};

export type Commit = {
  messageBody: string | null;
  messageHeadline: string | null;
  sha: string;
  checkSuites: Connection<CheckRun>;
};

export type PullRequest<C extends Partial<Commit>> = {
  author: GitHubUser;
  baseRefName: string;
  body: string | null;
  changedFiles: number;
  commits: Connection<C>;
  headRefName: string;
  mergeCommit: C | null;
  mergeable: string; // 'CONFLICTING' | 'MERGEABLE' | 'UNKNOWN';
  merged: boolean;
  number: number;
  reviewRequests: Connection<ReviewRequest>;
  reviews: Connection<Review>;
  state: string; // 'CLOSED' | 'MERGED' | 'OPEN';
  title: string;
  url: string;
};

export type ActualGraph = {
  repository: {
    owner: GitHubUser;
    name: string;
    url: string;
    pullRequest: PullRequest<Commit>;
  };
};

export type WebhookContext = {
  sender: GitHubUser;
  event: string;
  action: string;
  repository: {
    owner: GitHubUser;
    name: string;
    url: string;
  };
  number: number;
  baseRef: string;
  requestedReviewer?: GitHubUser;
  review?: Review;
};

export type KeyValueStore<T> = {
  [key: string]: T;
};

export type RenderModel =
  & Omit<WebhookContext, "repository">
  & ActualGraph
  & {
    userAccountMap: KeyValueStore<string>;
  };
