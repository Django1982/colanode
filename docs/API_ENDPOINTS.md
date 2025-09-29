# API Endpoints

## Inhaltsverzeichnis
- [Accounts](#accounts)
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
  - [Audit Logs](#admin---audit-logs)
- [Developer Notes](#developer-notes)

---

## Authentifizierung

- Gerätetokens (Präfix `cnd_`) authentifizieren `/client/v1`-Routen und stellen Account-Kontext bereit.
- Workspace-API-Tokens (Präfix `cna_`) authentifizieren `/rest/v1`-Routen; der bereitgestellte Read-Only-Token erlaubt ausschließlich GET.
- Header-Format: `Authorization: Bearer <token>`.
- `/client/v1` antwortet mit `401 token_invalid`, wenn ein API-Token statt eines Gerätetokens gesendet wird.

## Beispielaufrufe

```bash
# Client-API (Gerätetoken)
curl -H "Authorization: Bearer cnd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" https://cn-server-dev.djangos-net.de/client/v1/workspaces/01k67redw0saydh5gb69fk3swewc

# Rest-API (Workspace-Token)
curl -H "Authorization: Bearer cna_01k6a8s3wmacs89vkyfy7bzef4ate8db90d2c1fd43478247f5e66ddf9fe3eed633f7bd4d4c6db5c606940b321216" https://cn-server-dev.djangos-net.de/rest/v1/workspaces
```

## Accounts

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 📨 POST | `/client/v1/accounts/emails/login` | Login via Email/Passwort → gibt Tokens zurück oder fordert OTP an |
| 🆕 POST | `/client/v1/accounts/emails/register` | Erstellt ein Konto, erster User wird Admin |
| ✅ POST | `/client/v1/accounts/emails/verify` | Bestätigt Konto via OTP, gibt Tokens zurück |
| 🔑 POST | `/client/v1/accounts/emails/passwords/reset/init` | Generiert OTP & verschickt Reset-Mail |
| 🔄 POST | `/client/v1/accounts/emails/passwords/reset/complete` | Verifiziert OTP, setzt Passwort neu, loggt Geräte aus |
| 🌐 POST | `/client/v1/accounts/google/login` | OAuth-Login mit Google |
| 🔄 POST | `/client/v1/accounts/sync` | Synchronisiert Gerätedaten & liefert Profil |
| ✏️ PATCH | `/client/v1/accounts` | Ändert Name/Avatar, broadcastet Updates |
| 🔑 POST | `/client/v1/accounts/password` | Passwortwechsel, loggt Geräte aus, Audit-Log |
| 🚪 DELETE | `/client/v1/accounts/logout` | Beendet Session & sendet Logout-Event |

---

## Avatars

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 📤 POST | `/client/v1/avatars` | Lädt Avatar hoch (jpeg/png/webp → JPEG, S3-Speicher) |
| 📥 GET  | `/client/v1/avatars/:avatarId` | Lädt Avatar aus S3 |

---

## Sockets

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 🔑 POST | `/client/v1/sockets` | Erstellt Socket-ID für WebSocket-Init |
| 🔌 GET (WS) | `/client/v1/sockets/:socketId` | Upgrade zu WebSocket, registriert Live-Verbindung |

---

## Workspaces — Core

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 🆕 POST | `/client/v1/workspaces` | Erstellt Workspace |
| 📖 GET  | `/client/v1/workspaces/:workspaceId` | Ruft Workspace-Metadaten ab |
| ✏️ PATCH | `/client/v1/workspaces/:workspaceId` | Aktualisiert Workspace-Details |
| 🗑 DELETE | `/client/v1/workspaces/:workspaceId` | Deaktiviert Workspace, räumt Mitglieder auf |

---

## Workspaces — Files

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 📤 PUT | `/client/v1/workspaces/:workspaceId/files/:fileId` | Datei-Upload mit Limits & Logging |
| 📥 GET | `/client/v1/workspaces/:workspaceId/files/:fileId` | Datei-Download mit Zugriffskontrolle |
| 🔄 HEAD/POST/PATCH/DELETE | `/client/v1/workspaces/:workspaceId/files/:fileId/tus` | Resumable Uploads via TUS (S3/Redis) |

---

## Workspaces — Users

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 🆕 POST | `/client/v1/workspaces/:workspaceId/users` | Fügt User hinzu / lädt ein |
| ✏️ PATCH | `/client/v1/workspaces/:workspaceId/users/:userId/role` | Aktualisiert User-Rolle (auch Entfernen) |
| 📦 PATCH | `/client/v1/workspaces/:workspaceId/users/:userId/storage` | Passt Storage-Limits für User an |

---

## Workspaces — API Tokens

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 📖 GET | `/client/v1/workspaces/:workspaceId/api-tokens` | Listet API-Tokens |
| 🆕 POST | `/client/v1/workspaces/:workspaceId/api-tokens` | Erstellt neues Token |
| 🔄 POST | `/client/v1/workspaces/:workspaceId/api-tokens/:tokenId/rotate` | Regeneriert Secret / Ablaufdatum |
| 🗑 DELETE | `/client/v1/workspaces/:workspaceId/api-tokens/:tokenId` | Revokiert Token |

---

## Workspaces — API Settings & Storage

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| ✏️ PATCH | `/client/v1/workspaces/:workspaceId/api-settings` | Aktiviert/deaktiviert Workspace API |
| 📖 GET   | `/client/v1/workspaces/:workspaceId/storage` | Zeigt Storage-Verbrauch & Limits |

---

## Workspaces — Mutations

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 🔄 POST | `/client/v1/workspaces/:workspaceId/mutations` | Wendet CRDT-Mutationen an & gibt Status zurück |

---

## Admin — Accounts

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 📖 GET | `/client/v1/admin/accounts` | Listet Accounts mit Status & Rolle (sichtbar für Administratoren) |
| ✏️ PATCH | `/client/v1/admin/accounts/:accountId/role` | Ändert Rolle, Audit-Log (sichtbar für Administratoren) |
| ✏️ PATCH | `/client/v1/admin/accounts/:accountId/status` | Ändert Status (aktivieren/sperren, sichtbar für Administratoren) |
| 🔑 POST | `/client/v1/admin/accounts/:accountId/password-reset` | Sendet Reset-OTP-Mail & loggt Aktion (sichtbar für Administratoren) |

---

## Admin — Workspaces

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 📖 GET | `/client/v1/admin/workspaces` | Listet Workspaces mit Status (sichtbar für Administratoren) |
| 🔄 POST | `/client/v1/admin/workspaces/:workspaceId/restore` | Reaktiviert Workspace (sichtbar für Administratoren) |
| 🗑 POST | `/client/v1/admin/workspaces/:workspaceId/purge` | Markiert Workspace für sofortige Bereinigung (sichtbar für Administratoren) |

---

## Admin — Audit Logs

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| 📖 GET | `/client/v1/admin/audit-logs` | Listet Audit Logs, mit Filter & Pagination (sensitiv; standardmäßig ausgeblendet, Toggle nur für Super-Admins) |

---

## Developer Notes

-Die ursprünglichen Handler-Dateien (`apps/server/src/api/...`) sind in der [vollständigen Dokumentation](./API_ENDPOINTS.md) enthalten und können dort nachgeschlagen werden, wenn du die Code-Verlinkungen benötigst.
-Admin UI besitzt nun zwei Debug-Schalter: "Show resource IDs" (für Tabellen) und "Expose sensitive endpoints" (nur Super-Admins), damit bleibt `/client/v1/admin/audit-logs` standardmäßig verborgen.
