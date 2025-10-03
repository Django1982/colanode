import { toast } from 'sonner';

import { Container, ContainerBody } from '@colanode/ui/components/ui/container';
import { Checkbox } from '@colanode/ui/components/ui/checkbox';
import { Label } from '@colanode/ui/components/ui/label';
import { Separator } from '@colanode/ui/components/ui/separator';
import { WorkspaceDelete } from '@colanode/ui/components/workspaces/workspace-delete';
import { WorkspaceForm } from '@colanode/ui/components/workspaces/workspace-form';
import { useWorkspace } from '@colanode/ui/contexts/workspace';
import { useMutation } from '@colanode/ui/hooks/use-mutation';

export const WorkspaceSettings = () => {
  const workspace = useWorkspace();
  const { mutate: updateWorkspace, isPending: isUpdatingWorkspace } =
    useMutation();
  const { mutate: updateApiSettings, isPending: isUpdatingApi } = useMutation();
  const canEdit = workspace.role === 'owner';
  const apiEnabled = workspace.apiEnabled ?? false;

  const handleApiEnabledChange = (value: boolean) => {
    if (!canEdit) {
      return;
    }

    if (value === apiEnabled) {
      return;
    }

    updateApiSettings({
      input: {
        type: 'workspace.api-settings.update',
        accountId: workspace.accountId,
        workspaceId: workspace.id,
        apiEnabled: value,
      },
      onSuccess(result) {
        toast.success(
          result.apiEnabled ? 'Workspace API enabled' : 'Workspace API disabled'
        );
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  };

  return (
    <Container>
      <ContainerBody className="max-w-4xl space-y-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">General</h2>
            <Separator className="mt-3" />
          </div>
          <WorkspaceForm
            readOnly={!canEdit}
            values={{
              name: workspace.name,
              description: workspace.description ?? '',
              avatar: workspace.avatar ?? null,
            }}
            onSubmit={(values) => {
              updateWorkspace({
                input: {
                  type: 'workspace.update',
                  id: workspace.id,
                  accountId: workspace.accountId,
                  name: values.name,
                  description: values.description,
                  avatar: values.avatar ?? null,
                },
                onSuccess() {
                  toast.success('Workspace updated');
                },
                onError(error) {
                  toast.error(error.message);
                },
              });
            }}
            isSaving={isUpdatingWorkspace}
            saveText="Update"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">API Access</h2>
            <Separator className="mt-3" />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Workspace API</p>
                <p className="text-sm text-muted-foreground">
                  Allow owners to create API tokens for integrations and external
                  clients.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="workspace-api-enabled"
                  aria-label="Toggle workspace API access"
                  className="mt-1"
                  checked={apiEnabled}
                  disabled={!canEdit || isUpdatingApi}
                  onCheckedChange={(checked) => {
                    if (typeof checked !== 'boolean') {
                      return;
                    }
                    handleApiEnabledChange(checked);
                  }}
                />
                <Label
                  htmlFor="workspace-api-enabled"
                  className="text-sm font-medium"
                >
                  {apiEnabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>
            {!canEdit && (
              <p className="text-xs text-muted-foreground">
                Only workspace owners can change this setting.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Danger Zone
            </h2>
            <Separator className="mt-3" />
          </div>
          <WorkspaceDelete />
        </div>
      </ContainerBody>
    </Container>
  );
};
