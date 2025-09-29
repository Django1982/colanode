#!/usr/bin/env python3
import requests
import time
import os

# === Konfiguration ===
BASE_URL = "http://cn-server-dev.djangos-net.de"   # TODO: deine API-URL

# Auth Tokens
TOKEN_READONLY = "cna_01k6a8s3wmacs89vkyfy7bzef4at7d5a46ce793d42e8b49f2763531f836b1c983b5ad4ec494f9b5b76246eab73f8"   # TODO: dein Read-Only Token
TOKEN_RW       = "cna_01k6a8sexdnp7t39jh0fa5r2ntata3802973291e4d0baeb509e4e447ab175949f88664504dcaa714a9f7dc6049b2"   # TODO: dein Read/Write Token

# IDs / Variablen (TODO: anpassen!)
WORKSPACE_ID   = "01k67redw0saydh5gb69fk3swewc"
FILE_ID        = "1"
USER_ID        = "1"
TOKEN_ID       = "1"
ACCOUNT_ID     = "1"
SOCKET_ID      = "123"
AVATAR_ID      = "123"

TEST_EMAIL     = "test@example.com"
TEST_PASSWORD  = "pw123"
TEST_OTP       = "000000"

# Dummy-File für Uploads
TEST_FILE = "testfile.txt"
if not os.path.exists(TEST_FILE):
    with open(TEST_FILE, "w") as f:
        f.write("dummy test content\n")

# === Endpunkte ===
endpoints = [
    # Accounts
    {"method": "POST", "path": "/client/v1/accounts/emails/login", "payload": {"email": TEST_EMAIL, "password": "wrongpw"}},
    {"method": "POST", "path": "/client/v1/accounts/emails/register", "payload": {"email": "new@example.com", "password": TEST_PASSWORD}},
    {"method": "POST", "path": "/client/v1/accounts/emails/verify", "payload": {"otp": TEST_OTP}},
    {"method": "POST", "path": "/client/v1/accounts/emails/passwords/reset/init", "payload": {"email": TEST_EMAIL}},
    {"method": "POST", "path": "/client/v1/accounts/emails/passwords/reset/complete", "payload": {"otp": TEST_OTP, "newPassword": TEST_PASSWORD}},
    {"method": "POST", "path": "/client/v1/accounts/google/login", "payload": {"code": "dummy-code"}},
    {"method": "POST", "path": "/client/v1/accounts/sync"},
    {"method": "PATCH", "path": "/client/v1/accounts", "payload": {"name": "Tester"}},
    {"method": "POST", "path": "/client/v1/accounts/password", "payload": {"oldPassword": "oldpw", "newPassword": TEST_PASSWORD}},
    {"method": "DELETE", "path": "/client/v1/accounts/logout"},

    # Avatars
    {"method": "POST", "path": "/client/v1/avatars", "upload": True},
    {"method": "GET",  "path": f"/client/v1/avatars/{AVATAR_ID}"},

    # Sockets
    {"method": "POST", "path": "/client/v1/sockets"},
    {"method": "GET",  "path": f"/client/v1/sockets/{SOCKET_ID}"},

    # Workspaces — Core
    {"method": "POST", "path": "/client/v1/workspaces", "payload": {"name": "MyWorkspace"}},
    {"method": "GET",  "path": f"/client/v1/workspaces/{WORKSPACE_ID}"},
    {"method": "PATCH","path": f"/client/v1/workspaces/{WORKSPACE_ID}", "payload": {"name": "UpdatedWorkspace"}},
    {"method": "DELETE","path": f"/client/v1/workspaces/{WORKSPACE_ID}"},

    # Workspaces — Files
    {"method": "PUT", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/files/{FILE_ID}", "upload": True},
    {"method": "GET", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/files/{FILE_ID}"},
    {"method": "POST","path": f"/client/v1/workspaces/{WORKSPACE_ID}/files/{FILE_ID}/tus", "payload": {}},

    # Workspaces — Users
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/users", "payload": {"email": "user@example.com"}},
    {"method": "PATCH","path": f"/client/v1/workspaces/{WORKSPACE_ID}/users/{USER_ID}/role", "payload": {"role": "admin"}},
    {"method": "PATCH","path": f"/client/v1/workspaces/{WORKSPACE_ID}/users/{USER_ID}/storage", "payload": {"limit": 1000}},

    # Workspaces — API Tokens
    {"method": "GET",  "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens"},
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens"},
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens/{TOKEN_ID}/rotate"},
    {"method": "DELETE","path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens/{TOKEN_ID}"},

    # Workspaces — API Settings & Storage
    {"method": "PATCH","path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-settings", "payload": {"enabled": True}},
    {"method": "GET",  "path": f"/client/v1/workspaces/{WORKSPACE_ID}/storage"},

    # Workspaces — Mutations
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/mutations", "payload": {"mutations": []}},

    # Admin — Accounts
    {"method": "GET",  "path": "/client/v1/admin/accounts"},
    {"method": "PATCH","path": f"/client/v1/admin/accounts/{ACCOUNT_ID}/role", "payload": {"role": "user"}},
    {"method": "PATCH","path": f"/client/v1/admin/accounts/{ACCOUNT_ID}/status", "payload": {"status": "suspended"}},
    {"method": "POST", "path": f"/client/v1/admin/accounts/{ACCOUNT_ID}/password-reset"},

    # Admin — Workspaces
    {"method": "GET",  "path": "/client/v1/admin/workspaces"},
    {"method": "POST", "path": f"/client/v1/admin/workspaces/{WORKSPACE_ID}/restore"},
    {"method": "POST", "path": f"/client/v1/admin/workspaces/{WORKSPACE_ID}/purge"},

    # Admin — Audit Logs
    {"method": "GET",  "path": "/client/v1/admin/audit-logs"}
]

# === Test Runner ===
def run_tests():
    results = []
    for ep in endpoints:
        url = BASE_URL + ep["path"]
        method = ep["method"].upper()
        payload = ep.get("payload", None)
        upload = ep.get("upload", False)

        # Token wählen
        token = TOKEN_READONLY if method == "GET" else TOKEN_RW
        headers = {"Authorization": f"Bearer {token}"}

        print(f"⏳ Testing {method} {url} ...")
        start = time.time()
        try:
            if upload:
                with open(TEST_FILE, "rb") as f:
                    files = {"file": f}
                    resp = requests.request(method, url, headers=headers, files=files)
            else:
                resp = requests.request(method, url, headers={**headers, "Content-Type": "application/json"}, json=payload)

            elapsed = round((time.time() - start) * 1000, 2)
            results.append({
                "endpoint": f"{method} {ep['path']}",
                "status": resp.status_code,
                "time_ms": elapsed,
                "ok": 200 <= resp.status_code < 400
            })
        except Exception as e:
            results.append({
                "endpoint": f"{method} {ep['path']}",
                "status": "ERROR",
                "time_ms": None,
                "ok": False,
                "error": str(e)
            })

    print("\n=== API Test Report ===")
    for r in results:
        status = f"✅ {r['status']}" if r["ok"] else f"❌ {r['status']}"
        print(f"{r['endpoint']:<65} {status:<10} {r.get('time_ms','-')}ms")

if __name__ == "__main__":
    run_tests()
