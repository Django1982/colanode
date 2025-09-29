#!/usr/bin/env python3
import os
import time
from typing import Any, Dict, List

import requests

BASE_URL = os.getenv("COLANODE_BASE_URL", "https://cn-server-dev.djangos-net.de").rstrip("/")
TOKEN_READONLY = os.getenv(
    "COLANODE_TOKEN_READONLY",
    "cna_01k6a8s3wmacs89vkyfy7bzef4ate8db90d2c1fd43478247f5e66ddf9fe3eed633f7bd4d4c6db5c606940b321216",
)
TOKEN_RW = os.getenv("COLANODE_TOKEN_RW")

WORKSPACE_ID = os.getenv("COLANODE_WORKSPACE_ID", "01k67redw0saydh5gb69fk3swewc")
FILE_ID = os.getenv("COLANODE_FILE_ID", "1")
USER_ID = os.getenv("COLANODE_USER_ID", "1")
TOKEN_ID = os.getenv("COLANODE_TOKEN_ID", "1")
ACCOUNT_ID = os.getenv("COLANODE_ACCOUNT_ID", "1")
SOCKET_ID = os.getenv("COLANODE_SOCKET_ID", "123")
AVATAR_ID = os.getenv("COLANODE_AVATAR_ID", "123")

TEST_EMAIL = os.getenv("COLANODE_TEST_EMAIL", "test@example.com")
TEST_PASSWORD = os.getenv("COLANODE_TEST_PASSWORD", "pw123")
TEST_OTP = os.getenv("COLANODE_TEST_OTP", "000000")

TEST_FILE = os.getenv("COLANODE_TEST_FILE", "testfile.txt")
if not os.path.exists(TEST_FILE):
    with open(TEST_FILE, "w", encoding="utf-8") as handle:
        handle.write("dummy test content\n")

Endpoint = Dict[str, Any]

endpoints: List[Endpoint] = [
    {"method": "POST", "path": "/client/v1/accounts/emails/login", "payload": {"email": TEST_EMAIL, "password": "wrongpw"}, "requires_rw": True},
    {"method": "POST", "path": "/client/v1/accounts/emails/register", "payload": {"email": "new@example.com", "password": TEST_PASSWORD}, "requires_rw": True},
    {"method": "POST", "path": "/client/v1/accounts/emails/verify", "payload": {"otp": TEST_OTP}, "requires_rw": True},
    {"method": "POST", "path": "/client/v1/accounts/emails/passwords/reset/init", "payload": {"email": TEST_EMAIL}, "requires_rw": True},
    {"method": "POST", "path": "/client/v1/accounts/emails/passwords/reset/complete", "payload": {"otp": TEST_OTP, "newPassword": TEST_PASSWORD}, "requires_rw": True},
    {"method": "POST", "path": "/client/v1/accounts/google/login", "payload": {"code": "dummy-code"}, "requires_rw": True},
    {"method": "POST", "path": "/client/v1/accounts/sync", "requires_rw": True},
    {"method": "PATCH", "path": "/client/v1/accounts", "payload": {"name": "Tester"}, "requires_rw": True},
    {"method": "POST", "path": "/client/v1/accounts/password", "payload": {"oldPassword": "oldpw", "newPassword": TEST_PASSWORD}, "requires_rw": True},
    {"method": "DELETE", "path": "/client/v1/accounts/logout", "requires_rw": True},
    {"method": "POST", "path": "/client/v1/avatars", "upload": True, "requires_rw": True},
    {"method": "GET", "path": f"/client/v1/avatars/{AVATAR_ID}"},
    {"method": "POST", "path": "/client/v1/sockets", "requires_rw": True},
    {"method": "GET", "path": f"/client/v1/sockets/{SOCKET_ID}"},
    {"method": "POST", "path": "/client/v1/workspaces", "payload": {"name": "MyWorkspace"}, "requires_rw": True},
    {"method": "GET", "path": f"/client/v1/workspaces/{WORKSPACE_ID}"},
    {"method": "PATCH", "path": f"/client/v1/workspaces/{WORKSPACE_ID}", "payload": {"name": "UpdatedWorkspace"}, "requires_rw": True},
    {"method": "DELETE", "path": f"/client/v1/workspaces/{WORKSPACE_ID}", "requires_rw": True},
    {"method": "PUT", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/files/{FILE_ID}", "upload": True, "requires_rw": True},
    {"method": "GET", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/files/{FILE_ID}"},
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/files/{FILE_ID}/tus", "payload": {}, "requires_rw": True},
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/users", "payload": {"email": "user@example.com"}, "requires_rw": True},
    {"method": "PATCH", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/users/{USER_ID}/role", "payload": {"role": "admin"}, "requires_rw": True},
    {"method": "PATCH", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/users/{USER_ID}/storage", "payload": {"limit": 1000}, "requires_rw": True},
    {"method": "GET", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens"},
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens", "requires_rw": True},
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens/{TOKEN_ID}/rotate", "requires_rw": True},
    {"method": "DELETE", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-tokens/{TOKEN_ID}", "requires_rw": True},
    {"method": "PATCH", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/api-settings", "payload": {"enabled": True}, "requires_rw": True},
    {"method": "GET", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/storage"},
    {"method": "POST", "path": f"/client/v1/workspaces/{WORKSPACE_ID}/mutations", "payload": {"mutations": []}, "requires_rw": True},
    {"method": "GET", "path": "/client/v1/admin/accounts"},
    {"method": "PATCH", "path": f"/client/v1/admin/accounts/{ACCOUNT_ID}/role", "payload": {"role": "user"}, "requires_rw": True},
    {"method": "PATCH", "path": f"/client/v1/admin/accounts/{ACCOUNT_ID}/status", "payload": {"status": "suspended"}, "requires_rw": True},
    {"method": "POST", "path": f"/client/v1/admin/accounts/{ACCOUNT_ID}/password-reset", "requires_rw": True},
    {"method": "GET", "path": "/client/v1/admin/workspaces"},
    {"method": "POST", "path": f"/client/v1/admin/workspaces/{WORKSPACE_ID}/restore", "requires_rw": True},
    {"method": "POST", "path": f"/client/v1/admin/workspaces/{WORKSPACE_ID}/purge", "requires_rw": True},
    {"method": "GET", "path": "/client/v1/admin/audit-logs"},
]

def run_tests() -> None:
    results: List[Dict[str, Any]] = []
    for endpoint in endpoints:
        method = endpoint["method"].upper()
        path = endpoint["path"]
        requires_rw = endpoint.get("requires_rw", False)
        token = TOKEN_RW if requires_rw and TOKEN_RW else TOKEN_READONLY

        if requires_rw and not TOKEN_RW:
            results.append(
                {
                    "endpoint": f"{method} {path}",
                    "status": "SKIPPED",
                    "ok": False,
                    "time_ms": None,
                    "error": "RW token not configured",
                }
            )
            continue

        if not token:
            results.append(
                {
                    "endpoint": f"{method} {path}",
                    "status": "SKIPPED",
                    "ok": False,
                    "time_ms": None,
                    "error": "No token available",
                }
            )
            continue

        url = f"{BASE_URL}{path}"
        payload = endpoint.get("payload")
        upload = endpoint.get("upload", False)
        headers = {"Authorization": f"Bearer {token}"}

        print(f"\u23f3 Testing {method} {url} ...")
        started = time.time()

        try:
            if upload:
                with open(TEST_FILE, "rb") as handle:
                    files = {"file": handle}
                    response = requests.request(
                        method,
                        url,
                        headers=headers,
                        files=files,
                        timeout=30,
                    )
            else:
                request_headers = {**headers, "Content-Type": "application/json"}
                response = requests.request(
                    method,
                    url,
                    headers=request_headers,
                    json=payload,
                    timeout=30,
                )

            elapsed = round((time.time() - started) * 1000, 2)
            results.append(
                {
                    "endpoint": f"{method} {path}",
                    "status": response.status_code,
                    "ok": 200 <= response.status_code < 400,
                    "time_ms": elapsed,
                }
            )
        except Exception as error:  # noqa: BLE001
            results.append(
                {
                    "endpoint": f"{method} {path}",
                    "status": "ERROR",
                    "ok": False,
                    "time_ms": None,
                    "error": str(error),
                }
            )

    print("\n=== API Test Report ===")
    for result in results:
        ok = result["ok"]
        status = result["status"]
        prefix = "✅" if ok else "❌"
        time_ms = result.get("time_ms", "-")
        line = f"{result['endpoint']:<65} {prefix} {status:<8} {time_ms}ms"
        if not ok and "error" in result:
            line += f" ({result['error']})"
        print(line)


if __name__ == "__main__":
    run_tests()
