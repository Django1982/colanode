# API Endpoints

## Accounts
- `POST /client/v1/accounts/emails/login` — handler `emailLoginRoute` (`apps/server/src/api/client/routes/accounts/email-login.ts`): Authenticates email/password credentials, returning login tokens or OTP challenge when verification is pending.
- `POST /client/v1/accounts/emails/register` — handler `emailRegisterRoute` (`apps/server/src/api/client/routes/accounts/email-register.ts`): Creates a new account, auto-activating the first administrator and enforcing configured verification flow.
- `POST /client/v1/accounts/emails/verify` — handler `emailVerifyRoute` (`apps/server/src/api/client/routes/accounts/email-verify.ts`): Confirms an account via OTP and issues login tokens on success.
- `POST /client/v1/accounts/emails/passwords/reset/init` — handler `emailPasswordResetInitRoute` (`apps/server/src/api/client/routes/accounts/email-password-reset-init.ts`): Generates a password reset OTP and dispatches the notification email.
- `POST /client/v1/accounts/emails/passwords/reset/complete` — handler `emailPasswordResetCompleteRoute` (`apps/server/src/api/client/routes/accounts/email-password-reset-complete.ts`): Verifies the reset OTP, sets the new password, and revokes active devices.
- `POST /client/v1/accounts/google/login` — handler `googleLoginRoute` (`apps/server/src/api/client/routes/accounts/google-login.ts`): Exchanges a Google OAuth code for profile details, creating or activating the linked Colanode account.
- `POST /client/v1/accounts/sync` — handler `accountSyncRoute` (`apps/server/src/api/client/routes/accounts/account-sync.ts`): Updates device metadata and returns the account profile with active workspace memberships.
- `PATCH /client/v1/accounts` — handler `accountUpdateRoute` (`apps/server/src/api/client/routes/accounts/account-update.ts`): Updates account name/avatar and broadcasts account/user update events.
- `POST /client/v1/accounts/password` — handler `accountPasswordRoute` (`apps/server/src/api/client/routes/accounts/account-password.ts`): Rotates the authenticated user’s password, clears device sessions, and records an audit log entry.
- `DELETE /client/v1/accounts/logout` — handler `logoutRoute` (`apps/server/src/api/client/routes/accounts/logout.ts`): Removes the current device session and emits the device deletion event.

## Avatars
- `POST /client/v1/avatars` — handler `avatarUploadRoute` (`apps/server/src/api/client/routes/avatars/avatar-upload.ts`): Accepts direct image uploads (jpeg/png/webp), normalizes to JPEG, and stores the avatar in S3.
- `GET /client/v1/avatars/:avatarId` — handler `avatarDownloadRoute` (`apps/server/src/api/client/routes/avatars/avatar-download.ts`): Streams the requested avatar image from S3 if present.

## Sockets
- `POST /client/v1/sockets` — handler `socketInitHandler` (`apps/server/src/api/client/routes/sockets/socket-init.ts`): Issues a socket identifier tied to the authenticated account/device for subsequent WebSocket connections.
- `GET /client/v1/sockets/:socketId` (WebSocket) — handler `socketOpenHandler` (`apps/server/src/api/client/routes/sockets/socket-open.ts`): Upgrades to a WebSocket and registers the live connection for the provided socket identifier.

## Workspaces — Core
- `POST /client/v1/workspaces` — handler `workspaceCreateRoute` (`apps/server/src/api/client/routes/workspaces/workspace-create.ts`): Creates a workspace owned by the requesting account.
- `GET /client/v1/workspaces/:workspaceId` — handler `workspaceGetRoute` (`apps/server/src/api/client/routes/workspaces/workspace-get.ts`): Returns workspace metadata and the caller’s membership snapshot, enforcing active status and access.
- `PATCH /client/v1/workspaces/:workspaceId` — handler `workspaceUpdateRoute` (`apps/server/src/api/client/routes/workspaces/workspace-update.ts`): Owners can update workspace details and trigger workspace update events.
- `DELETE /client/v1/workspaces/:workspaceId` — handler `workspaceDeleteRoute` (`apps/server/src/api/client/routes/workspaces/workspace-delete.ts`): Owners deactivate the workspace, schedule cleanup, and revoke member access.

## Workspaces — Files
- `PUT /client/v1/workspaces/:workspaceId/files/:fileId` — handler `fileUploadRoute` (`apps/server/src/api/client/routes/workspaces/files/file-upload.ts`): Streams a direct upload, enforces size limits, updates node status, and records the upload entry.
- `GET /client/v1/workspaces/:workspaceId/files/:fileId` — handler `fileDownloadRoute` (`apps/server/src/api/client/routes/workspaces/files/file-download.ts`): Validates access and streams the requested file from storage.
- `HEAD|POST|PATCH|DELETE /client/v1/workspaces/:workspaceId/files/:fileId/tus` — handler `fileUploadTusRoute` (`apps/server/src/api/client/routes/workspaces/files/file-upload-tus.ts`): Provides resumable TUS uploads backed by S3 and Redis metadata.

## Workspaces — Users
- `POST /client/v1/workspaces/:workspaceId/users` — handler `usersCreateRoute` (`apps/server/src/api/client/routes/workspaces/users/users-create.ts`): Owners/admins invite or create user memberships for the workspace.
- `PATCH /client/v1/workspaces/:workspaceId/users/:userId/role` — handler `userRoleUpdateRoute` (`apps/server/src/api/client/routes/workspaces/users/user-role-update.ts`): Updates a member’s role, handling removal when downgraded to `none`.
- `PATCH /client/v1/workspaces/:workspaceId/users/:userId/storage` — handler `userStorageUpdateRoute` (`apps/server/src/api/client/routes/workspaces/users/user-storage-update.ts`): Adjusts per-user storage limits and maximum file size.

## Workspaces — API Tokens
- `GET /client/v1/workspaces/:workspaceId/api-tokens` — handler `workspaceApiTokenRoutes` (`apps/server/src/api/client/routes/workspaces/api-tokens/index.ts`): Lists active API tokens with scope and audit metadata.
- `POST /client/v1/workspaces/:workspaceId/api-tokens` — handler `workspaceApiTokenRoutes` (`apps/server/src/api/client/routes/workspaces/api-tokens/index.ts`): Creates a new API token, returning the clear-text secret and summary.
- `POST /client/v1/workspaces/:workspaceId/api-tokens/:tokenId/rotate` — handler `workspaceApiTokenRoutes` (`apps/server/src/api/client/routes/workspaces/api-tokens/index.ts`): Regenerates an API token secret and optionally adjusts expiry.
- `DELETE /client/v1/workspaces/:workspaceId/api-tokens/:tokenId` — handler `workspaceApiTokenRoutes` (`apps/server/src/api/client/routes/workspaces/api-tokens/index.ts`): Revokes the specified API token.

## Workspaces — API Settings & Storage
- `PATCH /client/v1/workspaces/:workspaceId/api-settings` — handler `workspaceApiSettingsRoute` (`apps/server/src/api/client/routes/workspaces/api-settings.ts`): Owners toggle workspace API availability and log the change.
- `GET /client/v1/workspaces/:workspaceId/storage` — handler `workspaceStorageGetRoute` (`apps/server/src/api/client/routes/workspaces/storage/workspace-storage-get.ts`): Returns aggregate storage usage by subtype and per-user limits/consumption.

## Workspaces — Mutations
- `POST /client/v1/workspaces/:workspaceId/mutations` — handler `mutationsSyncRoute` (`apps/server/src/api/client/routes/workspaces/mutations/mutations-sync.ts`): Applies CRDT mutations (nodes, documents, reactions, interactions) and reports per-mutation statuses.

## Admin — Accounts
- `GET /client/v1/admin/accounts` — handler `adminAccountRoutes` (`apps/server/src/api/client/routes/admin/accounts.ts`): Lists all accounts with role, status, and timestamps.
- `PATCH /client/v1/admin/accounts/:accountId/role` — handler `adminAccountRoutes` (`apps/server/src/api/client/routes/admin/accounts.ts`): Updates a server role for the selected account and records an audit log entry.
- `PATCH /client/v1/admin/accounts/:accountId/status` — handler `adminAccountRoutes` (`apps/server/src/api/client/routes/admin/accounts.ts`): Changes account status (activate, suspend, etc.) with audit logging.
- `POST /client/v1/admin/accounts/:accountId/password-reset` — handler `adminAccountRoutes` (`apps/server/src/api/client/routes/admin/accounts.ts`): Issues a password reset OTP email for the account and records the action.

## Admin — Workspaces
- `GET /client/v1/admin/workspaces` — handler `adminWorkspaceRoutes` (`apps/server/src/api/client/routes/admin/workspaces.ts`): Lists workspaces with status, deletion timestamps, and API enablement.
- `POST /client/v1/admin/workspaces/:workspaceId/restore` — handler `adminWorkspaceRoutes` (`apps/server/src/api/client/routes/admin/workspaces.ts`): Reactivates a workspace and re-enables member access.
- `POST /client/v1/admin/workspaces/:workspaceId/purge` — handler `adminWorkspaceRoutes` (`apps/server/src/api/client/routes/admin/workspaces.ts`): Queues an immediate purge job and marks the workspace for cleanup.

## Admin — Audit Logs
- `GET /client/v1/admin/audit-logs` — handler `adminAuditLogsRoute` (`apps/server/src/api/client/routes/admin/audit-logs.ts`): Returns paginated audit log entries filtered by workspace, account, or user with cursor-based pagination.
