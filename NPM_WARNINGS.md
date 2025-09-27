# npm Build Warnings

The server image build (`apps/server/Dockerfile`) surfaced deprecation warnings while running `npm ci`:

- `stable@0.1.8` – deprecated because modern JS guarantees stable `Array#sort`.
- `rimraf@3.0.2` – versions prior to v4 are no longer supported.
- `inflight@1.0.6` – unmaintained and leaks memory; replace with `lru-cache` or remove the dependency chain.
- `glob@7.2.3` – upgrade to v9+.
- `eslint@8.57.1` – outside the supported window; upgrade to a maintained release.
- `@shopify/semaphore@3.1.0`, `@humanwhocodes/object-schema@2.0.3`, `@humanwhocodes/config-array@0.13.0`, `source-map@0.8.0-beta.0` – deprecated packages kept for compatibility.

Track upstream upgrades or pin replacements so the runtime image can eventually be built without deprecated modules.
