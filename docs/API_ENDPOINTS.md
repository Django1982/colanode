# API Endpoints

## Table of Contents
- [Authentication](#authentication)
- [Auth Endpoints](#auth-endpoints)
- [Accounts](#accounts)
- [Device Tokens](#device-tokens)
- [Avatars](#avatars)
- [Sockets](#sockets)
- [Workspaces](#workspaces)
  - [Core](#workspaces---core)
  - [Files](#workspaces---files)
  - [Users](#workspaces---users)
  - [API Tokens](#workspaces---api-tokens)
  - [API Settings & Storage](#workspaces---api-settings--storage)
  - [Mutations](#workspaces---mutations)
- [Admin](#admin)
  - [Accounts](#admin---accounts)
  - [Workspaces](#admin---workspaces)
  - [Tokens](#admin---tokens)
  - [Audit Logs](#admin---audit-logs)
  - [Logs](#admin---logs)

---

## Authentication

Colanode uses two types of tokens for authentication:

### Device Tokens (prefix: `cnd_`)
- Authenticate `/client/v1` routes
- Provide account context for client operations
- Support scopes:
  - `read_only`: Read and sync operations only
  - `approval_full`: Full read and write permissions
- Can be issued using an existing device token (requires `approval_full` scope) or workspace API token

### Workspace API Tokens (prefix: `cna_`)
- Authenticate `/rest/v1` routes (not covered in this document)
- Can be used to issue device tokens
- Support scopes:
  - `read_only`: GET operations only
  - `write`: Full CRUD operations

### Header Format
```
Authorization: Bearer <token>
```

**Important**: `/client/v1` routes will return `401 token_invalid` if a workspace API token is sent instead of a device token (except for the device token issuance endpoint).

---

## Auth Endpoints

### Issue Device Token

Creates a new device token for authentication.

**Endpoint**: `POST /client/v1/auth/device-tokens`

**Authentication**: Device token (`cnd_` with `approval_full` scope) OR Workspace API token (`cna_`)

**Request Body**:
```json
{
  "scopes": ["read_only"],  // optional, default: ["read_only"]
  "type": "desktop",        // optional: "web" or "desktop"
  "platform": "macOS",      // optional
  "version": "1.0.0"        // optional
}
```

**Response** (201):
```json
{
  "deviceId": "01k67redw0saydh5gb69fk3swewc",
  "token": "cnd_...",
  "scopes": ["read_only"]
}
```

**Python Example**:
```python
import requests

# Using workspace API token to create a device token
workspace_token = "cna_your_workspace_api_token_here"
headers = {
    "Authorization": f"Bearer {workspace_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://your-server.com/client/v1/auth/device-tokens",
    headers=headers,
    json={
        "scopes": ["read_only"],
        "type": "desktop",
        "platform": "macOS",
        "version": "1.0.0"
    }
)

if response.status_code == 201:
    data = response.json()
    device_token = data["token"]
    print(f"Device token created: {device_token}")
    print(f"Device ID: {data['deviceId']}")
    print(f"Scopes: {data['scopes']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**Using existing device token to create another**:
```python
import requests

# Using device token with approval_full scope
device_token = "cnd_existing_token_with_approval_full"
headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://your-server.com/client/v1/auth/device-tokens",
    headers=headers,
    json={
        "scopes": ["approval_full"],
        "type": "web",
        "platform": "Linux",
        "version": "2.0.0"
    }
)

if response.status_code == 201:
    data = response.json()
    print(f"New device token: {data['token']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Accounts

### Register Account

Creates a new account. The first registered user becomes an administrator.

**Endpoint**: `POST /client/v1/accounts/emails/register`

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Python Example**:
```python
import requests

response = requests.post(
    "https://your-server.com/client/v1/accounts/emails/register",
    json={
        "email": "user@example.com",
        "password": "SecurePassword123!",
        "name": "John Doe"
    }
)

if response.status_code == 200:
    data = response.json()
    if data.get("needsVerification"):
        print("Account created. Verification required.")
        print(f"Verification ID: {data.get('verificationId')}")
    else:
        print(f"Account created and logged in.")
        print(f"Device token: {data.get('deviceToken')}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Login with Email

Login via email and password.

**Endpoint**: `POST /client/v1/accounts/emails/login`

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Python Example**:
```python
import requests

response = requests.post(
    "https://your-server.com/client/v1/accounts/emails/login",
    json={
        "email": "user@example.com",
        "password": "SecurePassword123!"
    }
)

if response.status_code == 200:
    data = response.json()
    if data.get("needsVerification"):
        print("Login successful. OTP verification required.")
        print(f"Verification ID: {data.get('verificationId')}")
    else:
        device_token = data.get("deviceToken")
        print(f"Login successful!")
        print(f"Device token: {device_token}")
        print(f"Account ID: {data.get('accountId')}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Verify Account

Verifies account using OTP code.

**Endpoint**: `POST /client/v1/accounts/emails/verify`

**Authentication**: None

**Request Body**:
```json
{
  "verificationId": "01k67redw0saydh5gb69fk3swewc",
  "code": "123456"
}
```

**Python Example**:
```python
import requests

response = requests.post(
    "https://your-server.com/client/v1/accounts/emails/verify",
    json={
        "verificationId": "01k67redw0saydh5gb69fk3swewc",
        "code": "123456"
    }
)

if response.status_code == 200:
    data = response.json()
    device_token = data.get("deviceToken")
    print(f"Account verified successfully!")
    print(f"Device token: {device_token}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Initiate Password Reset

Generates OTP and sends password reset email.

**Endpoint**: `POST /client/v1/accounts/emails/passwords/reset/init`

**Authentication**: None

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Python Example**:
```python
import requests

response = requests.post(
    "https://your-server.com/client/v1/accounts/emails/passwords/reset/init",
    json={
        "email": "user@example.com"
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"Password reset initiated.")
    print(f"Verification ID: {data.get('verificationId')}")
    print("Check your email for the OTP code.")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Complete Password Reset

Verifies OTP and sets new password. Logs out all devices.

**Endpoint**: `POST /client/v1/accounts/emails/passwords/reset/complete`

**Authentication**: None

**Request Body**:
```json
{
  "verificationId": "01k67redw0saydh5gb69fk3swewc",
  "code": "123456",
  "password": "NewSecurePassword123!"
}
```

**Python Example**:
```python
import requests

response = requests.post(
    "https://your-server.com/client/v1/accounts/emails/passwords/reset/complete",
    json={
        "verificationId": "01k67redw0saydh5gb69fk3swewc",
        "code": "123456",
        "password": "NewSecurePassword123!"
    }
)

if response.status_code == 200:
    print("Password reset successful. All devices have been logged out.")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Sync Account

Synchronizes device data and retrieves account profile.

**Endpoint**: `POST /client/v1/accounts/sync`

**Authentication**: Device token

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://your-server.com/client/v1/accounts/sync",
    headers=headers,
    json={}
)

if response.status_code == 200:
    data = response.json()
    print(f"Account ID: {data.get('id')}")
    print(f"Email: {data.get('email')}")
    print(f"Name: {data.get('name')}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Update Account

Updates account name and/or avatar. Broadcasts updates to connected clients.

**Endpoint**: `PATCH /client/v1/accounts`

**Authentication**: Device token

**Request Body**:
```json
{
  "name": "Jane Doe",
  "avatarId": "01k67redw0saydh5gb69fk3swewc"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.patch(
    "https://your-server.com/client/v1/accounts",
    headers=headers,
    json={
        "name": "Jane Doe",
        "avatarId": "01k67redw0saydh5gb69fk3swewc"
    }
)

if response.status_code == 200:
    print("Account updated successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Change Password

Changes account password. Logs out all devices and creates audit log entry.

**Endpoint**: `POST /client/v1/accounts/password`

**Authentication**: Device token

**Request Body**:
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://your-server.com/client/v1/accounts/password",
    headers=headers,
    json={
        "currentPassword": "OldPassword123!",
        "newPassword": "NewPassword123!"
    }
)

if response.status_code == 200:
    print("Password changed successfully. All devices have been logged out.")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Logout

Ends current session and sends logout event.

**Endpoint**: `DELETE /client/v1/accounts/logout`

**Authentication**: Device token

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.delete(
    "https://your-server.com/client/v1/accounts/logout",
    headers=headers
)

if response.status_code == 200:
    print("Logged out successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Device Tokens

### List Device Tokens

Lists all device tokens for an account. Users can only view their own tokens unless they are administrators.

**Endpoint**: `GET /client/v1/accounts/:accountId/device-tokens`

**Authentication**: Device token

**Path Parameters**:
- `accountId`: Account ID

**Response** (200):
```json
[
  {
    "id": "01k67redw0saydh5gb69fk3swewc",
    "scopes": ["read_only"],
    "platform": "macOS",
    "version": "1.0.0",
    "createdAt": "2025-10-03T10:30:00Z",
    "lastUsedAt": "2025-10-03T12:45:00Z",
    "type": 1
  }
]
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
account_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    f"https://your-server.com/client/v1/accounts/{account_id}/device-tokens",
    headers=headers
)

if response.status_code == 200:
    tokens = response.json()
    print(f"Found {len(tokens)} device token(s):")
    for token in tokens:
        print(f"  - ID: {token['id']}")
        print(f"    Platform: {token['platform']}")
        print(f"    Scopes: {token['scopes']}")
        print(f"    Created: {token['createdAt']}")
        print(f"    Last used: {token['lastUsedAt']}")
        print()
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Revoke Device Token

Revokes (deletes) a device token. Users can only delete their own tokens unless they are administrators.

**Endpoint**: `DELETE /client/v1/accounts/:accountId/device-tokens/:deviceId`

**Authentication**: Device token

**Path Parameters**:
- `accountId`: Account ID
- `deviceId`: Device token ID to revoke

**Response**: 204 No Content on success

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
account_id = "01k67redw0saydh5gb69fk3swewc"
device_id = "01k67redw0saydh5gb69fk3sxyz"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.delete(
    f"https://your-server.com/client/v1/accounts/{account_id}/device-tokens/{device_id}",
    headers=headers
)

if response.status_code == 204:
    print(f"Device token {device_id} revoked successfully")
elif response.status_code == 404:
    print("Device token not found")
elif response.status_code == 403:
    print("You don't have permission to revoke this token")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Avatars

### Upload Avatar

Uploads an avatar image (JPEG/PNG/WebP, converted to JPEG, stored in S3).

**Endpoint**: `POST /client/v1/avatars`

**Authentication**: Device token

**Request**: Multipart form data with image file

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

with open("avatar.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post(
        "https://your-server.com/client/v1/avatars",
        headers=headers,
        files=files
    )

if response.status_code == 200:
    data = response.json()
    avatar_id = data.get("avatarId")
    print(f"Avatar uploaded successfully. Avatar ID: {avatar_id}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Download Avatar

Downloads an avatar from S3.

**Endpoint**: `GET /client/v1/avatars/:avatarId`

**Authentication**: Device token

**Path Parameters**:
- `avatarId`: Avatar ID

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
avatar_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    f"https://your-server.com/client/v1/avatars/{avatar_id}",
    headers=headers
)

if response.status_code == 200:
    with open(f"avatar_{avatar_id}.jpg", "wb") as f:
        f.write(response.content)
    print(f"Avatar downloaded successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Sockets

### Initialize Socket

Creates a socket ID for WebSocket initialization.

**Endpoint**: `POST /client/v1/sockets`

**Authentication**: Device token

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://your-server.com/client/v1/sockets",
    headers=headers,
    json={}
)

if response.status_code == 200:
    data = response.json()
    socket_id = data.get("socketId")
    print(f"Socket ID created: {socket_id}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Open WebSocket

Upgrades connection to WebSocket and registers live connection.

**Endpoint**: `GET /client/v1/sockets/:socketId` (WebSocket upgrade)

**Authentication**: Device token (via query parameter or header)

**Python Example** (using websockets library):
```python
import asyncio
import websockets
import json

async def connect_websocket():
    device_token = "cnd_your_device_token_here"
    socket_id = "01k67redw0saydh5gb69fk3swewc"

    uri = f"wss://your-server.com/client/v1/sockets/{socket_id}"
    headers = {
        "Authorization": f"Bearer {device_token}"
    }

    async with websockets.connect(uri, extra_headers=headers) as websocket:
        print("WebSocket connected")

        # Receive messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

# Run the WebSocket client
asyncio.run(connect_websocket())
```

---

## Workspaces — Core

### Create Workspace

Creates a new workspace.

**Endpoint**: `POST /client/v1/workspaces`

**Authentication**: Device token

**Request Body**:
```json
{
  "name": "My Workspace",
  "slug": "my-workspace"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    "https://your-server.com/client/v1/workspaces",
    headers=headers,
    json={
        "name": "My Workspace",
        "slug": "my-workspace"
    }
)

if response.status_code == 201:
    data = response.json()
    workspace_id = data.get("id")
    print(f"Workspace created successfully. ID: {workspace_id}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Get Workspace

Retrieves workspace metadata.

**Endpoint**: `GET /client/v1/workspaces/:workspaceId`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}",
    headers=headers
)

if response.status_code == 200:
    workspace = response.json()
    print(f"Workspace: {workspace['name']}")
    print(f"Slug: {workspace['slug']}")
    print(f"Created: {workspace['createdAt']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Update Workspace

Updates workspace details.

**Endpoint**: `PATCH /client/v1/workspaces/:workspaceId`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID

**Request Body**:
```json
{
  "name": "Updated Workspace Name",
  "avatarId": "01k67redw0saydh5gb69fk3swewc"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.patch(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}",
    headers=headers,
    json={
        "name": "Updated Workspace Name",
        "avatarId": "01k67redw0saydh5gb69fk3swewc"
    }
)

if response.status_code == 200:
    print("Workspace updated successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Delete Workspace

Deactivates workspace and cleans up members.

**Endpoint**: `DELETE /client/v1/workspaces/:workspaceId`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.delete(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}",
    headers=headers
)

if response.status_code == 204:
    print("Workspace deleted successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Workspaces — Files

### Upload File

Uploads a file with size limits and logging.

**Endpoint**: `PUT /client/v1/workspaces/:workspaceId/files/:fileId`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID
- `fileId`: File ID

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"
file_id = "01k67redw0saydh5gb69fk3sxyz"

headers = {
    "Authorization": f"Bearer {device_token}"
}

with open("document.pdf", "rb") as f:
    files = {"file": f}
    response = requests.put(
        f"https://your-server.com/client/v1/workspaces/{workspace_id}/files/{file_id}",
        headers=headers,
        files=files
    )

if response.status_code == 200:
    print(f"File uploaded successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Download File

Downloads a file with access control.

**Endpoint**: `GET /client/v1/workspaces/:workspaceId/files/:fileId`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID
- `fileId`: File ID

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"
file_id = "01k67redw0saydh5gb69fk3sxyz"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/files/{file_id}",
    headers=headers
)

if response.status_code == 200:
    with open(f"downloaded_file_{file_id}", "wb") as f:
        f.write(response.content)
    print(f"File downloaded successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### TUS Resumable Upload

Resumable file uploads via TUS protocol (S3/Redis backed).

**Endpoints**:
- `HEAD /client/v1/workspaces/:workspaceId/files/:fileId/tus`
- `POST /client/v1/workspaces/:workspaceId/files/:fileId/tus`
- `PATCH /client/v1/workspaces/:workspaceId/files/:fileId/tus`
- `DELETE /client/v1/workspaces/:workspaceId/files/:fileId/tus`

**Authentication**: Device token

**Python Example** (using tus-py-client):
```python
from tusclient import client

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"
file_id = "01k67redw0saydh5gb69fk3sxyz"

headers = {
    "Authorization": f"Bearer {device_token}"
}

tus_client = client.TusClient(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/files/{file_id}/tus",
    headers=headers
)

uploader = tus_client.uploader("large_file.zip", chunk_size=5*1024*1024)
uploader.upload()

print("File uploaded successfully")
```

---

## Workspaces — Users

### Add User

Adds or invites a user to workspace.

**Endpoint**: `POST /client/v1/workspaces/:workspaceId/users`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID

**Request Body**:
```json
{
  "email": "user@example.com",
  "role": "member"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/users",
    headers=headers,
    json={
        "email": "user@example.com",
        "role": "member"
    }
)

if response.status_code == 201:
    data = response.json()
    print(f"User added successfully. User ID: {data.get('userId')}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Update User Role

Updates user role in workspace (can also remove user).

**Endpoint**: `PATCH /client/v1/workspaces/:workspaceId/users/:userId/role`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID
- `userId`: User ID

**Request Body**:
```json
{
  "role": "admin"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"
user_id = "01k67redw0saydh5gb69fk3sxyz"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.patch(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/users/{user_id}/role",
    headers=headers,
    json={
        "role": "admin"
    }
)

if response.status_code == 200:
    print("User role updated successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Update User Storage

Adjusts storage limits for a user.

**Endpoint**: `PATCH /client/v1/workspaces/:workspaceId/users/:userId/storage`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID
- `userId`: User ID

**Request Body**:
```json
{
  "storageLimit": 10737418240
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"
user_id = "01k67redw0saydh5gb69fk3sxyz"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

# Set storage limit to 10GB
storage_limit_bytes = 10 * 1024 * 1024 * 1024

response = requests.patch(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/users/{user_id}/storage",
    headers=headers,
    json={
        "storageLimit": storage_limit_bytes
    }
)

if response.status_code == 200:
    print("User storage limit updated successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Workspaces — API Tokens

### List Workspace API Tokens

Lists all API tokens for a workspace. Only workspace admins can access.

**Endpoint**: `GET /client/v1/workspaces/:workspaceId/api-tokens`

**Authentication**: Device token (requires workspace admin role)

**Path Parameters**:
- `workspaceId`: Workspace ID

**Response** (200):
```json
[
  {
    "id": "01k67redw0saydh5gb69fk3swewc",
    "name": "Production API Token",
    "description": "Token for production environment",
    "scopes": ["read_only"],
    "tokenPrefix": "cna_abc123",
    "expiresAt": "2026-10-03T00:00:00Z",
    "lastRotatedAt": null,
    "lastUsedAt": "2025-10-03T12:00:00Z",
    "disabledAt": null,
    "createdAt": "2025-01-01T00:00:00Z",
    "createdBy": "01k67redw0saydh5gb69fk3sxyz"
  }
]
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/api-tokens",
    headers=headers
)

if response.status_code == 200:
    tokens = response.json()
    print(f"Found {len(tokens)} API token(s):")
    for token in tokens:
        print(f"  - Name: {token['name']}")
        print(f"    ID: {token['id']}")
        print(f"    Prefix: {token['tokenPrefix']}")
        print(f"    Scopes: {token['scopes']}")
        print(f"    Expires: {token['expiresAt']}")
        print()
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Create Workspace API Token

Creates a new workspace API token. Only workspace admins can create tokens.

**Endpoint**: `POST /client/v1/workspaces/:workspaceId/api-tokens`

**Authentication**: Device token (requires workspace admin role)

**Path Parameters**:
- `workspaceId`: Workspace ID

**Request Body**:
```json
{
  "name": "Production API Token",
  "description": "Token for production environment",
  "scopes": ["read_only"],
  "expiresInDays": 365
}
```

**Response** (201):
```json
{
  "token": "cna_full_token_here",
  "apiToken": {
    "id": "01k67redw0saydh5gb69fk3swewc",
    "name": "Production API Token",
    "description": "Token for production environment",
    "scopes": ["read_only"],
    "tokenPrefix": "cna_abc123",
    "expiresAt": "2026-10-03T00:00:00Z",
    "lastRotatedAt": null,
    "lastUsedAt": null,
    "disabledAt": null,
    "createdAt": "2025-10-03T00:00:00Z",
    "createdBy": "01k67redw0saydh5gb69fk3sxyz"
  }
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/api-tokens",
    headers=headers,
    json={
        "name": "Production API Token",
        "description": "Token for production environment",
        "scopes": ["read_only"],
        "expiresInDays": 365
    }
)

if response.status_code == 201:
    data = response.json()
    full_token = data["token"]
    token_info = data["apiToken"]

    print(f"API Token created successfully!")
    print(f"Full token (save this, it won't be shown again): {full_token}")
    print(f"Token ID: {token_info['id']}")
    print(f"Token prefix: {token_info['tokenPrefix']}")
    print(f"Expires: {token_info['expiresAt']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Rotate Workspace API Token

Rotates (regenerates) a workspace API token secret and optionally updates expiry.

**Endpoint**: `POST /client/v1/workspaces/:workspaceId/api-tokens/:tokenId/rotate`

**Authentication**: Device token (requires workspace admin role)

**Path Parameters**:
- `workspaceId`: Workspace ID
- `tokenId`: API token ID

**Request Body**:
```json
{
  "expiresInDays": 180
}
```

**Response** (200):
```json
{
  "token": "cna_new_rotated_token_here",
  "apiToken": {
    "id": "01k67redw0saydh5gb69fk3swewc",
    "name": "Production API Token",
    "description": "Token for production environment",
    "scopes": ["read_only"],
    "tokenPrefix": "cna_xyz789",
    "expiresAt": "2026-04-01T00:00:00Z",
    "lastRotatedAt": "2025-10-03T00:00:00Z",
    "lastUsedAt": "2025-10-03T12:00:00Z",
    "disabledAt": null,
    "createdAt": "2025-01-01T00:00:00Z",
    "createdBy": "01k67redw0saydh5gb69fk3sxyz"
  }
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"
token_id = "01k67redw0saydh5gb69fk3stoken"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/api-tokens/{token_id}/rotate",
    headers=headers,
    json={
        "expiresInDays": 180
    }
)

if response.status_code == 200:
    data = response.json()
    new_token = data["token"]
    token_info = data["apiToken"]

    print(f"API Token rotated successfully!")
    print(f"New token (save this): {new_token}")
    print(f"Last rotated: {token_info['lastRotatedAt']}")
    print(f"New expiry: {token_info['expiresAt']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Revoke Workspace API Token

Revokes (disables) a workspace API token. Only workspace admins can revoke tokens.

**Endpoint**: `DELETE /client/v1/workspaces/:workspaceId/api-tokens/:tokenId`

**Authentication**: Device token (requires workspace admin role)

**Path Parameters**:
- `workspaceId`: Workspace ID
- `tokenId`: API token ID to revoke

**Response**: 204 No Content on success

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"
token_id = "01k67redw0saydh5gb69fk3stoken"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.delete(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/api-tokens/{token_id}",
    headers=headers
)

if response.status_code == 204:
    print(f"API token {token_id} revoked successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Workspaces — API Settings & Storage

### Update API Settings

Enables or disables workspace API access.

**Endpoint**: `PATCH /client/v1/workspaces/:workspaceId/api-settings`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID

**Request Body**:
```json
{
  "apiEnabled": true
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.patch(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/api-settings",
    headers=headers,
    json={
        "apiEnabled": True
    }
)

if response.status_code == 200:
    print("Workspace API access enabled successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Get Storage Usage

Displays storage usage and limits for workspace.

**Endpoint**: `GET /client/v1/workspaces/:workspaceId/storage`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/storage",
    headers=headers
)

if response.status_code == 200:
    data = response.json()
    used_gb = data["used"] / (1024**3)
    limit_gb = data["limit"] / (1024**3)
    print(f"Storage used: {used_gb:.2f} GB / {limit_gb:.2f} GB")
    print(f"Percentage: {(data['used']/data['limit']*100):.1f}%")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Workspaces — Mutations

### Sync Mutations

Applies CRDT mutations and returns status.

**Endpoint**: `POST /client/v1/workspaces/:workspaceId/mutations`

**Authentication**: Device token

**Path Parameters**:
- `workspaceId`: Workspace ID

**Request Body**: CRDT mutation data

**Python Example**:
```python
import requests

device_token = "cnd_your_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

mutations = {
    "mutations": [
        {
            "id": "mutation_id",
            "type": "update",
            "nodeId": "node_id",
            "data": {}
        }
    ]
}

response = requests.post(
    f"https://your-server.com/client/v1/workspaces/{workspace_id}/mutations",
    headers=headers,
    json=mutations
)

if response.status_code == 200:
    data = response.json()
    print(f"Mutations applied successfully")
    print(f"Status: {data}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Admin — Accounts

### List Accounts

Lists all accounts with status and role. Only visible to administrators.

**Endpoint**: `GET /client/v1/admin/accounts`

**Authentication**: Device token (requires administrator role)

**Query Parameters**:
- `limit`: Number of results (default: 50, max: 100)
- `cursor`: Pagination cursor

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/accounts",
    headers=headers,
    params={"limit": 20}
)

if response.status_code == 200:
    data = response.json()
    accounts = data.get("accounts", [])
    print(f"Found {len(accounts)} accounts:")
    for account in accounts:
        print(f"  - {account['email']}: {account['status']} ({account['role']})")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Update Account Role

Changes account role. Creates audit log entry. Only administrators can access.

**Endpoint**: `PATCH /client/v1/admin/accounts/:accountId/role`

**Authentication**: Device token (requires administrator role)

**Path Parameters**:
- `accountId`: Account ID

**Request Body**:
```json
{
  "role": "administrator"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
account_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.patch(
    f"https://your-server.com/client/v1/admin/accounts/{account_id}/role",
    headers=headers,
    json={
        "role": "administrator"
    }
)

if response.status_code == 200:
    print("Account role updated successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Update Account Status

Changes account status (activate/suspend). Only administrators can access.

**Endpoint**: `PATCH /client/v1/admin/accounts/:accountId/status`

**Authentication**: Device token (requires administrator role)

**Path Parameters**:
- `accountId`: Account ID

**Request Body**:
```json
{
  "status": "active"
}
```

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
account_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.patch(
    f"https://your-server.com/client/v1/admin/accounts/{account_id}/status",
    headers=headers,
    json={
        "status": "active"
    }
)

if response.status_code == 200:
    print("Account status updated successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Admin Password Reset

Sends password reset OTP email and logs action. Only administrators can access.

**Endpoint**: `POST /client/v1/admin/accounts/:accountId/password-reset`

**Authentication**: Device token (requires administrator role)

**Path Parameters**:
- `accountId`: Account ID

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
account_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"https://your-server.com/client/v1/admin/accounts/{account_id}/password-reset",
    headers=headers,
    json={}
)

if response.status_code == 200:
    print("Password reset email sent successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Admin — Workspaces

### List Workspaces

Lists all workspaces with status. Only administrators can access.

**Endpoint**: `GET /client/v1/admin/workspaces`

**Authentication**: Device token (requires administrator role)

**Query Parameters**:
- `limit`: Number of results (default: 50, max: 100)
- `cursor`: Pagination cursor

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/workspaces",
    headers=headers,
    params={"limit": 20}
)

if response.status_code == 200:
    data = response.json()
    workspaces = data.get("workspaces", [])
    print(f"Found {len(workspaces)} workspaces:")
    for workspace in workspaces:
        print(f"  - {workspace['name']}: {workspace['status']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Restore Workspace

Reactivates a deleted workspace. Only administrators can access.

**Endpoint**: `POST /client/v1/admin/workspaces/:workspaceId/restore`

**Authentication**: Device token (requires administrator role)

**Path Parameters**:
- `workspaceId`: Workspace ID

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"https://your-server.com/client/v1/admin/workspaces/{workspace_id}/restore",
    headers=headers,
    json={}
)

if response.status_code == 200:
    print("Workspace restored successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Purge Workspace

Marks workspace for immediate cleanup/deletion. Only administrators can access.

**Endpoint**: `POST /client/v1/admin/workspaces/:workspaceId/purge`

**Authentication**: Device token (requires administrator role)

**Path Parameters**:
- `workspaceId`: Workspace ID

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swewc"

headers = {
    "Authorization": f"Bearer {device_token}",
    "Content-Type": "application/json"
}

response = requests.post(
    f"https://your-server.com/client/v1/admin/workspaces/{workspace_id}/purge",
    headers=headers,
    json={}
)

if response.status_code == 200:
    print("Workspace marked for purge successfully")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Admin — Tokens

### List All Tokens

Lists all tokens (workspace API tokens and device tokens) across the system. Only administrators can access.

**Endpoint**: `GET /client/v1/admin/tokens`

**Authentication**: Device token (requires administrator role)

**Query Parameters**:
- `accountId`: Filter by account ID (optional)
- `workspaceId`: Filter by workspace ID (optional)
- `tokenType`: Filter by type: `device`, `workspace`, or `all` (optional, default: all)
- `limit`: Number of results (default: 50, max: 100)
- `cursor`: Pagination cursor (optional)

**Response** (200):
```json
{
  "tokens": [
    {
      "id": "01k67redw0saydh5gb69fk3swewc",
      "type": "workspace",
      "name": "Production API Token",
      "accountId": "01k67redw0saydh5gb69fk3sxyz",
      "accountEmail": "admin@example.com",
      "workspaceId": "01k67redw0saydh5gb69fk3swork",
      "workspaceName": "My Workspace",
      "scopes": ["read_only"],
      "createdAt": "2025-01-01T00:00:00Z",
      "lastUsedAt": "2025-10-03T12:00:00Z",
      "expiresAt": "2026-01-01T00:00:00Z",
      "status": "active",
      "platform": null,
      "version": null,
      "tokenPrefix": "cna_abc123"
    },
    {
      "id": "01k67redw0saydh5gb69fk3sdev",
      "type": "device",
      "name": null,
      "accountId": "01k67redw0saydh5gb69fk3sxyz",
      "accountEmail": "admin@example.com",
      "workspaceId": null,
      "workspaceName": null,
      "scopes": ["read_only"],
      "createdAt": "2025-10-01T00:00:00Z",
      "lastUsedAt": "2025-10-03T14:00:00Z",
      "expiresAt": null,
      "status": "active",
      "platform": "macOS",
      "version": "1.0.0",
      "tokenPrefix": null
    }
  ],
  "hasMore": false,
  "nextCursor": null
}
```

**Python Example - List all tokens**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/tokens",
    headers=headers,
    params={"limit": 50}
)

if response.status_code == 200:
    data = response.json()
    tokens = data["tokens"]
    print(f"Found {len(tokens)} token(s):")

    for token in tokens:
        print(f"\n  Type: {token['type']}")
        print(f"  ID: {token['id']}")
        print(f"  Account: {token['accountEmail']}")

        if token['type'] == 'workspace':
            print(f"  Name: {token['name']}")
            print(f"  Workspace: {token['workspaceName']}")
            print(f"  Prefix: {token['tokenPrefix']}")
            print(f"  Expires: {token['expiresAt']}")
        else:
            print(f"  Platform: {token['platform']}")
            print(f"  Version: {token['version']}")

        print(f"  Scopes: {token['scopes']}")
        print(f"  Status: {token['status']}")
        print(f"  Last used: {token['lastUsedAt']}")

    if data["hasMore"]:
        print(f"\nMore results available. Use cursor: {data['nextCursor']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**Python Example - Filter by account**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
account_id = "01k67redw0saydh5gb69fk3sxyz"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/tokens",
    headers=headers,
    params={
        "accountId": account_id,
        "limit": 50
    }
)

if response.status_code == 200:
    data = response.json()
    tokens = data["tokens"]
    print(f"Found {len(tokens)} token(s) for account {account_id}")

    for token in tokens:
        print(f"  - {token['type']}: {token['id']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**Python Example - Filter by workspace and type**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swork"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/tokens",
    headers=headers,
    params={
        "workspaceId": workspace_id,
        "tokenType": "workspace",
        "limit": 50
    }
)

if response.status_code == 200:
    data = response.json()
    tokens = data["tokens"]
    print(f"Found {len(tokens)} workspace API token(s) for workspace {workspace_id}")

    for token in tokens:
        print(f"  - {token['name']}: {token['tokenPrefix']}")
        print(f"    Status: {token['status']}, Expires: {token['expiresAt']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**Python Example - Pagination**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

all_tokens = []
cursor = None

while True:
    params = {"limit": 50}
    if cursor:
        params["cursor"] = cursor

    response = requests.get(
        "https://your-server.com/client/v1/admin/tokens",
        headers=headers,
        params=params
    )

    if response.status_code == 200:
        data = response.json()
        all_tokens.extend(data["tokens"])

        if not data["hasMore"]:
            break

        cursor = data["nextCursor"]
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
        break

print(f"Total tokens retrieved: {len(all_tokens)}")
```

---

## Admin — Audit Logs

### List Audit Logs

Lists audit logs with filtering and pagination. Only administrators can access. Sensitive endpoint - typically hidden by default in UI.

**Endpoint**: `GET /client/v1/admin/audit-logs`

**Authentication**: Device token (requires administrator role)

**Query Parameters**:
- `limit`: Number of results (default: 50, max: 200)
- `cursor`: Pagination cursor (ISO 8601 timestamp)
- `workspaceId`: Filter by workspace ID (optional)
- `accountId`: Filter by account ID (optional)
- `userId`: Filter by user ID (optional)

**Response** (200):
```json
{
  "entries": [
    {
      "id": "01k67redw0saydh5gb69fk3swewc",
      "workspaceId": "01k67redw0saydh5gb69fk3swork",
      "userId": "01k67redw0saydh5gb69fk3suser",
      "accountId": "01k67redw0saydh5gb69fk3sacct",
      "apiTokenId": null,
      "action": "account.password_changed",
      "resourceType": "account",
      "resourceId": "01k67redw0saydh5gb69fk3sacct",
      "metadata": {
        "oldPasswordHash": "...",
        "newPasswordHash": "..."
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-10-03T12:00:00Z"
    }
  ],
  "nextCursor": "2025-10-03T11:00:00Z"
}
```

**Python Example - List recent audit logs**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/audit-logs",
    headers=headers,
    params={"limit": 50}
)

if response.status_code == 200:
    data = response.json()
    entries = data["entries"]
    print(f"Found {len(entries)} audit log entries:")

    for entry in entries:
        print(f"\n  Action: {entry['action']}")
        print(f"  Resource: {entry['resourceType']} ({entry['resourceId']})")
        print(f"  Account: {entry['accountId']}")
        print(f"  IP: {entry['ipAddress']}")
        print(f"  Time: {entry['createdAt']}")
        if entry['metadata']:
            print(f"  Metadata: {entry['metadata']}")

    if data["nextCursor"]:
        print(f"\nNext cursor: {data['nextCursor']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**Python Example - Filter by workspace**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
workspace_id = "01k67redw0saydh5gb69fk3swork"

headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/audit-logs",
    headers=headers,
    params={
        "workspaceId": workspace_id,
        "limit": 100
    }
)

if response.status_code == 200:
    data = response.json()
    print(f"Found {len(data['entries'])} audit logs for workspace {workspace_id}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**Python Example - Pagination**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

all_entries = []
cursor = None

while True:
    params = {"limit": 200}
    if cursor:
        params["cursor"] = cursor

    response = requests.get(
        "https://your-server.com/client/v1/admin/audit-logs",
        headers=headers,
        params=params
    )

    if response.status_code == 200:
        data = response.json()
        all_entries.extend(data["entries"])

        if not data["nextCursor"]:
            break

        cursor = data["nextCursor"]
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
        break

print(f"Total audit log entries: {len(all_entries)}")
```

---

## Admin — Logs

Server logs are written line-by-line as JSON to `/var/log/colanode/server.log`. Both endpoints accept an optional `?limit=` parameter (1-500, default 100).

### Get Recent Logs

Returns the last N log lines (includes info/warn/error).

**Endpoint**: `GET /client/v1/admin/logs/tail`

**Authentication**: Device token (requires administrator role)

**Query Parameters**:
- `limit`: Number of log lines (default: 100, min: 1, max: 500)

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/logs/tail",
    headers=headers,
    params={"limit": 50}
)

if response.status_code == 200:
    data = response.json()
    logs = data.get("logs", [])
    print(f"Last {len(logs)} log entries:")

    for log in logs:
        level = log.get("level")
        msg = log.get("msg")
        time = log.get("time")
        print(f"[{time}] {level}: {msg}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

### Get Error Logs

Returns error and fatal log entries (Pino level >= 50) of the last N matches.

**Endpoint**: `GET /client/v1/admin/logs/errors`

**Authentication**: Device token (requires administrator role)

**Query Parameters**:
- `limit`: Number of error log lines (default: 100, min: 1, max: 500)

**Python Example**:
```python
import requests

device_token = "cnd_your_admin_device_token_here"
headers = {
    "Authorization": f"Bearer {device_token}"
}

response = requests.get(
    "https://your-server.com/client/v1/admin/logs/errors",
    headers=headers,
    params={"limit": 100}
)

if response.status_code == 200:
    data = response.json()
    errors = data.get("logs", [])
    print(f"Found {len(errors)} error/fatal log entries:")

    for error in errors:
        level = error.get("level")
        msg = error.get("msg")
        time = error.get("time")
        err = error.get("err", {})

        print(f"\n[{time}] {level}: {msg}")
        if err:
            print(f"  Error type: {err.get('type')}")
            print(f"  Message: {err.get('message')}")
            if err.get('stack'):
                print(f"  Stack: {err.get('stack')[:200]}...")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Developer Notes

- **Authentication**: Always include the `Authorization: Bearer <token>` header with the appropriate token type for each endpoint.
- **Token Scopes**: Ensure your device token has the required scope (`read_only` or `approval_full`) for write operations.
- **Admin Endpoints**: All `/client/v1/admin/*` endpoints require administrator role.
- **Error Handling**: Always check response status codes and handle errors appropriately.
- **Rate Limiting**: Some authentication endpoints (like login) have rate limiting. Handle 429 responses gracefully.
- **Pagination**: Use cursor-based pagination for endpoints that return large datasets.
- **WebSocket**: For real-time updates, use the socket endpoints to establish a WebSocket connection.
- **File Uploads**: For large files, use the TUS resumable upload endpoints for better reliability.
- **Audit Logs**: The audit logs endpoint is sensitive and should be used carefully. It's hidden by default in the Admin UI.
- **Server Logs**: Log files are stored in newline-delimited JSON format at `/var/log/colanode/server.log`.

For complete implementation details, refer to the route handler files in `apps/server/src/api/client/routes/`.
