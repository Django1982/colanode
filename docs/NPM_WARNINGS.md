# npm Build Warnings

The server image build (`apps/server/Dockerfile`) surfaced deprecation warnings while running `npm ci`:

- `stable@0.1.8` – deprecated because modern JS guarantees stable `Array#sort`.
  - source: `scripts/package.json` → `svg-sprite@^2.0.4` pulls `svgo@2`, which depends on `stable`.
  - plan: investigate upgrading to a maintained sprite builder (newer `svg-sprite` release or an in-house pipeline using `svgo@4`) once registry access is available.
- `rimraf@3.0.2` – versions prior to v4 are no longer supported.
  - source: electron toolchain (`@electron/node-gyp`, `@npmcli/move-file`, `flat-cache`, `temp`).
  - plan: evaluate the Electron Forge 7.10+ stack (or npm overrides) when we can fetch packages; note that `rimraf@5` requires Node 18+.
- `inflight@1.0.6` – unmaintained and leaks memory; replace with `lru-cache` or remove the dependency chain.
  - source: legacy `glob@7` pulled by the same electron build dependencies.
  - plan: upgrading `glob` consumers will retire `inflight`; track this alongside the `rimraf` upgrade.
- `glob@7.2.3` – upgrade to v9+.
  - source: electron build pipeline (`@electron/asar`, `electron-installer-common`, `sucrase`, `workbox-build`).
  - plan: audit compatibility of these packages with `glob@9` and schedule a coordinated upgrade.
- `eslint@8.57.1` – outside the supported window; upgrade to a maintained release.
  - source: root devDependency in `package.json`.
  - plan: bump to ESLint 9 together with `@typescript-eslint@8` presets and rerun `npm install` once we have package registry access.
- `@shopify/semaphore@3.1.0`, `@humanwhocodes/object-schema@2.0.3`, `@humanwhocodes/config-array@0.13.0`, `source-map@0.8.0-beta.0` – deprecated packages kept for compatibility.
  - plan: monitor upstream releases; document any runtime impact before removal.

Track upstream upgrades or pin replacements so the runtime image can eventually be built without deprecated modules.
