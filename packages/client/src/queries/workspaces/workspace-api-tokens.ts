import { ApiTokenScopeValue } from '@colanode/core';

export type WorkspaceApiTokenSummary = {
  id: string;
  name: string;
  description: string | null;
  scopes: ApiTokenScopeValue[];
  tokenPrefix: string;
  expiresAt: string | null;
  lastRotatedAt: string | null;
  lastUsedAt: string | null;
  disabledAt: string | null;
  createdAt: string;
  createdBy: string | null;
};

export const WORKSPACE_API_TOKENS_LIST_QUERY =
  'workspace.api-tokens.list' as const;

export type WorkspaceApiTokensListQueryInput = {
  type: typeof WORKSPACE_API_TOKENS_LIST_QUERY;
  accountId: string;
  workspaceId: string;
};

export type WorkspaceApiTokenSecretOutput = {
  token: string;
  apiToken: WorkspaceApiTokenSummary;
};

export type WorkspaceApiTokensListOutput = WorkspaceApiTokenSummary[];

declare module '@colanode/client/queries' {
  interface QueryMap {
    'workspace.api-tokens.list': {
      input: WorkspaceApiTokensListQueryInput;
      output: WorkspaceApiTokensListOutput;
    };
  }
}
