# Maintaining `n8n-nodes-workflowbuddy`

Internal notes for maintainers. User-facing documentation lives in [README.md](README.md).

## Project layout

- `nodes/WorkflowBuddy/WorkflowBuddy.node.ts` — the node (declarative routing). Also exports `handleNotifyResponse`, which maps API errors (400/401/429/502/503) to actionable messages.
- `credentials/WorkflowBuddyApi.credentials.ts` — Bearer-token credential incl. credential test (see below).
- `test/mock-server.mjs` — zero-dependency mock of the companion API. Used by the tests and standalone via `npm run mock` (port 3933).
- `test/workflowbuddy.test.mts` — vitest suite. Tests live in `.mts`/`.mjs` files **on purpose**: the strict-mode cloud-compat lint applies to all shipped `**/*.ts` and must stay green; do not rename them to `.ts`.
- `examples/error-alert-workflow.json` — importable example workflow referenced by the README.

## Everyday commands

```sh
npm run build     # compile to dist/
npm run lint      # n8n community-node linter (must stay green — verification requirement)
npm test          # vitest: description shape, request mapping vs. mock, error handler, credential test
npm run mock      # standalone API mock on http://127.0.0.1:3933 (prints test keys)
npm run dev       # official n8n-node dev loop: builds, links the package, starts a local n8n
```

## How the credential test works (and its limits)

There is no test endpoint that avoids sending a real push. The credential test therefore POSTs an **empty body** to `/api/notify`:

- The API checks **authentication before validation**, so a valid key yields `400` (validation error) — which proves the key works without delivering a push.
- The test request uses `ignoreHttpStatusErrors: { ignore: true, except: [401, 429] }`, so `400` is treated as success while `401`/`429` fail the test.

Verified against n8n 2.25 (REST `/rest/credentials/test`): valid key → "Connection successful!", invalid key → auth error, rate-limited → rate-limit error. Note: n8n currently shows its **default** messages for 401/429 (e.g. "Authorization failed - please check your credentials"); the custom `responseCode` rule messages in the credential are not surfaced because n8n's tester only consults them when `error.cause.response` is set, which the current routing engine does not provide. The rules are kept as cheap forward-compatibility.

If the API ever changes its auth-before-validation ordering, this credential test breaks — coordinate with the backend team.

## Manual end-to-end test against the mock (how it was verified)

Automated tests cover the contract, but to see the node inside a real n8n:

1. `npm run build`, then point the compiled output at the mock:
   `sed -i '' 's|https://companion.amelus.de|http://127.0.0.1:3933|g' dist/nodes/WorkflowBuddy/WorkflowBuddy.node.js dist/credentials/WorkflowBuddyApi.credentials.js`
2. `npm run mock` (prints the valid key and the special keys that trigger 429/502/503).
3. Either `npm run dev` (interactive, opens a local n8n) or headless: seed `$N8N_USER_FOLDER/.n8n/nodes/node_modules/` with this package (plus a symlink to `node_modules/n8n-workflow`), then use `n8n import:credentials`, `import:workflow`, and `execute`.
4. **Rebuild afterwards** (`npm run build`) so `dist/` targets production again. The source files are never touched by this procedure.

## Releasing

~~⛔ **Publishing gate:** do not publish to npm or submit for verification until (a) the app version with the Push API UI (Settings → Push API) is live in the App Store and (b) `companion.amelus.de/api/notify` is deployed to production. The WorkflowBuddy team will give the go-ahead.~~

✅ **GATE LIFTED — 2026-08-03.** Both conditions have in fact been met since **2026-06-10**; the gate simply outlived them by eight weeks because nobody checked. Verified on 2026-08-03:

- **(a) App:** WorkflowBuddy **2.2.0**, carrying *Settings → Push API*, has been `READY_FOR_SALE` in the App Store since 2026-06-10.
- **(b) Backend:** `POST https://companion.amelus.de/api/notify` is live and behaves as documented. Probed from outside: no key, malformed key, missing `Authorization` header and a `Basic` scheme all return `401 {"error":"Unauthorized"}`; `/health` returns `200`.
- **Auth-before-validation still holds** — the ordering this package's credential test depends on. An empty body with an invalid key returns `401`, not `400`, so authentication is evaluated first. (The complementary case — *valid* key + empty body → `400` — cannot be probed without a real key from the app and is the one remaining unverified step; see the checklist below.)

**Lesson worth keeping:** this gate, the identical one in `n8n-templates/CLAUDE.md`, and the templates publishing hold all expired on the same day and all went unnoticed for the same eight weeks. A gate needs a named owner and a check date, otherwise it silently becomes the blocker it was meant to prevent.

Before the first release — **status checked 2026-08-03**, items 3 and 5 are what actually block the first publish:

1. ✅ **Done.** The GitHub owner is `amelus-ug` (set in package.json `repository`, the credential `documentationUrl`, and `nodes/WorkflowBuddy/WorkflowBuddy.node.json`). npm `repository` URL and author **must match** the public GitHub repo (n8n verification requirement). The publisher is **Amelus UG (haftungsbeschränkt)** — the npm account used for publishing must reflect that identity (author email is currently `tino.anic@amelus.de`).
2. ✅ **Verified 2026-08-03** against the app's own `Localizable.xcstrings`, not against memory or the handoff doc. The menu entry `settings.push_api` and the view title `push_api.title` both read **"Push API"** in de/en and **"API Push"** in es/fr. The README's "Settings → Push API" is therefore correct for the English UI, and the localized variants quoted in the templates brief ("Einstellungen → Push API", "Ajustes → API Push", "Réglages → API Push") match the shipped strings.
3. ⬜ **Open — needs a local n8n.** Two `<!-- TODO before submission -->` placeholders remain (README lines 9 and 73). `npm run dev` boots n8n 2.32.7 with this package linked in about 70 s; the editor then asks for a local owner account before the canvas is reachable. Add the README screenshots (placeholders are marked with `<!-- TODO ... -->`).
4. ⬜ **Open — needs a Notify Key from the app.** The contract was probed from outside on 2026-08-03 (see the gate note above): auth-before-validation holds, all four unauthenticated variants return `401`. What is still unproven is the *happy path* — a real push arriving on a real iPhone. That needs a key from **Settings → Push API**, which only exists on an installed app. Run one real end-to-end test against `https://companion.amelus.de` with a personal key.
5. ⬜ **Open — the hard blocker.** `npm whoami` reports no login on this machine, and `registry.npmjs.org/n8n-nodes-workflowbuddy` returns **404**: the package has never been published, so **nobody can install this node** — n8n's *Settings → Community Nodes* installs from npm. Until this is done the repo being public on GitHub buys nothing. Set up npm Trusted Publishing (OIDC) for this repo — see the detailed comments in [.github/workflows/publish.yml](.github/workflows/publish.yml).

The node icon is the real app icon (iOS "Default" export for n8n's light UI, "Dark" export for dark UI) from `n8n-companion/.../Assets.xcassets/Icon Exports/`. The linter requires `.svg` icons, and no vector source exists, so each icon is the 256×256 PNG base64-embedded in an SVG wrapper (`<image href="data:image/png;base64,…">`). If the app icon changes, regenerate both files the same way.

Release process (after the gate is lifted):

```sh
npm run release
```

This lints, builds, prompts for the version bump, updates the changelog, commits, tags, and pushes. The tag push triggers `.github/workflows/publish.yml`, which publishes to npm **with provenance** — a hard n8n requirement since 2026-05-01; never `npm publish` locally.

After the first publish: run `npx @n8n/scan-community-package n8n-nodes-workflowbuddy` (it scans the published npm package), then submit via the [n8n Creator Portal](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/) and re-check the [verification guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/) once more.

## When the API changes

- The production base URL is defined **twice**: in `WorkflowBuddy.node.ts` (`requestDefaults.baseURL`) and `WorkflowBuddyApi.credentials.ts` (`test.request.baseURL`).
- New/changed fields: extend the node properties (with `routing.send`), the mock's validation, and the tests.
- Changed limits: update the `429` message in `handleNotifyResponse` **and** the Limits section of the README (both say "currently" on purpose).
- New error semantics: extend `handleNotifyResponse`, the mock, and the error-handler tests together.
- Keep `test/mock-server.mjs` an exact mirror of the documented contract — the test suite treats it as the source of truth.

## Verification constraints (do not regress)

- No runtime dependencies (only `devDependencies` / `peerDependencies`).
- No environment-variable or filesystem access in shipped node code; the cloud-compat linter enforces this — keep `strict: true` in package.json's `n8n` section and do not modify `eslint.config.mjs` (strict mode compares it byte-for-byte).
- Everything user-facing in English.
- Exactly one service per package (WorkflowBuddy only).
