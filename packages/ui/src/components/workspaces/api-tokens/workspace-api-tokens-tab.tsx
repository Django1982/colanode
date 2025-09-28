import { Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ApiTokenScope, ApiTokenScopeValue } from '@colanode/core';
import {
  WORKSPACE_API_TOKENS_LIST_QUERY,
  WorkspaceApiTokenSecretOutput,
} from '@colanode/client/queries/workspaces/workspace-api-tokens';
import { Button } from '@colanode/ui/components/ui/button';
import { Input } from '@colanode/ui/components/ui/input';
import { Label } from '@colanode/ui/components/ui/label';
import { Separator } from '@colanode/ui/components/ui/separator';
import { Spinner } from '@colanode/ui/components/ui/spinner';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';
import { useQuery } from '@colanode/ui/hooks/use-query';

const formatDate = (value: string | null) => {
  if (!value) {
    return '—';
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const scopesOptions: { value: ApiTokenScopeValue; label: string; description: string }[] = [
  {
    value: ApiTokenScope.Read,
    label: 'Read',
    description: 'Access workspace resources in read-only mode.',
  },
  {
    value: ApiTokenScope.Write,
    label: 'Write',
    description: 'Create and update workspace content.',
  },
];

export const WorkspaceApiTokensTab = () => {
  const workspace = useWorkspace();
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [selectedScopes, setSelectedScopes] = useState<ApiTokenScopeValue[]>([
    ApiTokenScope.Read,
  ]);
  const [latestSecret, setLatestSecret] = useState<WorkspaceApiTokenSecretOutput | null>(
    null
  );

  const tokensQuery = useQuery(
    {
      type: WORKSPACE_API_TOKENS_LIST_QUERY,
      accountId: workspace.accountId,
      workspaceId: workspace.id,
    },
    {
      enabled: workspace.apiEnabled ?? false,
    }
  );

  const { mutate: createToken, isPending: isCreating } = useMutation();
  const { mutate: rotateToken, isPending: isRotating } = useMutation();
  const { mutate: deleteToken, isPending: isDeleting } = useMutation();

  const isLoading = tokensQuery.isLoading || tokensQuery.isFetching;
  const tokens = useMemo(() => tokensQuery.data ?? [], [tokensQuery.data]);

  const refetchTokens = () => {
    void tokensQuery.refetch?.();
  };

  const handleCopySecret = (token: string) => {
    void navigator.clipboard.writeText(token).then(() => {
      toast.success('Token copied to clipboard');
    });
  };

  const handleScopeToggle = (value: ApiTokenScopeValue, checked: boolean) => {
    setSelectedScopes((prev) => {
      if (checked) {
        if (prev.includes(value)) {
          return prev;
        }
        return [...prev, value];
      }

      if (value === ApiTokenScope.Read) {
        return [ApiTokenScope.Read];
      }

      return prev.filter((scope) => scope !== value);
    });
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Token name is required.');
      return;
    }

    createToken({
      input: {
        type: 'workspace.api-tokens.create',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        scopes: selectedScopes,
        expiresInDays,
      },
      onSuccess(result) {
        setLatestSecret(result);
        toast.success('API token created');
        setCreateFormOpen(false);
        setName('');
        setDescription('');
        setSelectedScopes([ApiTokenScope.Read]);
        setExpiresInDays(30);
        refetchTokens();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleRotate = (tokenId: string) => {
    rotateToken({
      input: {
        type: 'workspace.api-tokens.rotate',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        tokenId,
      },
      onSuccess(result) {
        setLatestSecret(result);
        toast.success('API token rotated');
        refetchTokens();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  const handleDelete = (tokenId: string) => {
    deleteToken({
      input: {
        type: 'workspace.api-tokens.delete',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        tokenId,
      },
      onSuccess() {
        toast.success('API token revoked');
        refetchTokens();
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  if (!workspace.apiEnabled) {
    return (
      <div className="space-y-4 p-6">
        <h2 className="text-2xl font-semibold tracking-tight">API Tokens</h2>
        <Separator />
        <p className="text-sm text-muted-foreground">
          Enable the workspace API in settings to create and manage API tokens.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">API Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Manage programmatic access secrets for this workspace.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => void refetchTokens()} variant="outline" size="sm">
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateFormOpen((prev) => !prev)}>
            {createFormOpen ? 'Cancel' : 'Create token'}
          </Button>
        </div>
      </div>

      {createFormOpen && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api-token-name">Name</Label>
              <Input
                id="api-token-name"
                placeholder="Production integration"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-token-expiry">Expires in days</Label>
              <Input
                id="api-token-expiry"
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (Number.isNaN(next)) {
                    setExpiresInDays(30);
                  } else {
                    setExpiresInDays(next);
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-token-description">Description (optional)</Label>
            <Input
              id="api-token-description"
              placeholder="Notes about usage"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-3">
            <Label>Scopes</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {scopesOptions.map((scope) => {
                const checked = selectedScopes.includes(scope.value);
                return (
                  <label
                    key={scope.value}
                    className="flex cursor-pointer flex-col rounded-md border border-border bg-background p-3 hover:border-primary"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{scope.label}</span>
                      <input
                        type="checkbox"
                        className="size-4"
                        checked={checked}
                        onChange={(event) =>
                          handleScopeToggle(scope.value, event.target.checked)
                        }
                      />
                    </div>
                    <span className="mt-2 text-xs text-muted-foreground">
                      {scope.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? <Spinner className="mr-2" /> : null}
              Create token
            </Button>
            <Button
              onClick={() => {
                setCreateFormOpen(false);
                setName('');
                setDescription('');
                setSelectedScopes([ApiTokenScope.Read]);
                setExpiresInDays(30);
              }}
              variant="ghost"
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {latestSecret && (
        <div className="rounded-lg border border-blue-400/40 bg-blue-500/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Token secret</p>
              <p className="text-xs text-muted-foreground">
                The full token is shown once. Store it securely.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopySecret(latestSecret.token)}
            >
              <Copy className="mr-2 size-4" /> Copy token
            </Button>
          </div>
          <code className="block break-all rounded-md bg-background px-3 py-2 text-sm">
            {latestSecret.token}
          </code>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Prefix</th>
              <th className="px-4 py-3 text-left font-medium">Scopes</th>
              <th className="px-4 py-3 text-left font-medium">Expires</th>
              <th className="px-4 py-3 text-left font-medium">Last used</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tokens.map((token) => (
              <tr key={token.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{token.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {token.description ?? '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-mono">{token.tokenPrefix}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {token.scopes.map((scope) => (
                      <span
                        key={`${token.id}-${scope}`}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(token.expiresAt)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(token.lastUsedAt)}
                </td>
                <td className="px-4 py-3 text-xs">
                  {token.disabledAt ? (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-500">
                      Revoked
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-500">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isRotating || Boolean(token.disabledAt)}
                      onClick={() => handleRotate(token.id)}
                    >
                      Rotate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isDeleting || Boolean(token.disabledAt)}
                      onClick={() => handleDelete(token.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {tokens.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No API tokens have been created yet.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center">
                  <Spinner className="mx-auto" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
