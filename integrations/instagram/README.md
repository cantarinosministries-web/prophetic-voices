# Instagram — Spirit Immersion

Independent Worker; does not modify the website Worker, production database, root configuration or main. Default is simulation with sends disabled. No Meta credentials or actual account/post IDs are included.

## Validation

`npm ci`, `npm test`, `node simulate.js`, `npm run check` from this directory. The simulator uses in-memory SQLite with the actual migration, two synthetic accounts and duplicate events; it cannot send network requests. Test account IDs are not valid Meta IDs.

## Deployment (Workers Free only)

Confirm the Workers plan is Free, inspect shared account usage for Workers, D1 and Queues. Stop rather than upgrade. Create a NEW D1 `pv-instagram`, queues `pv-instagram-events` and `pv-instagram-dead`; replace the placeholder database ID here. Apply this directory's migration only to that new database. Publish with this directory's config, never the root deploy script. Do not attach domain routes. Keep MODE=simulation and SEND_ENABLED=false.

Create secrets with `wrangler secret put META_APP_SECRET` and `META_VERIFY_TOKEN`. Never put values in repository, URLs, logs or chat. Use dedicated `IG_OCANTARINO_TOKEN` and `IG_TPV_TOKEN` secrets for authorized accounts. Default adapter uses Unified Login and graph.facebook.com, as recommended for new Meta apps. Set META_API_HOST=graph.instagram.com only for an authorized legacy Instagram Login token. Hosts are restricted to those two official domains. Never mix tokens/login types. The Unified Login flow requires a business portfolio and an approved login configuration in Meta. GRAPH_VERSION must be a currently supported version verified at setup time.

Authorize the Meta app and both professional accounts. Validate permissions and app access/review requirements against the current official private replies guide. Subscribe to comments for both accounts and set callback `/webhook`. Obtain actual account and selected campaign media IDs through Meta. Enable only explicit per-account/per-post rules after checking ownership and approving final reply text/link. No rule matches every post. No real campaign data is seeded remotely until IDs are verified.

## Campaign

Handles: @ocantarino and @thepropheticvoices. Suggested initial exact keyword: SPIRIT. Destination from existing website: https://thepropheticvoices.com.br/spirit-immersion.html — verify publicly before enabling. Proposed private reply: “Conheça o Spirit Immersion: https://thepropheticvoices.com.br/spirit-immersion.html”. Public replies and follow-up messages are not implemented.

## Delivery safeguards

HMAC SHA-256 authenticates exact webhook body. Signed events are filtered to feed/reels comments. Account and media allowlists, enabled flags, keyword matching, seven-day deadline and live comment timestamp verification apply. Atomic account/comment claim prevents duplicate private replies. Simulation claims are never replayed as live sends. Uncertain network outcomes remain `uncertain`; never delete/retry a claim without checking Meta delivery manually. This deliberately prefers missed sends over duplicate messages. A crash after claim may require manual reconciliation. Automatic retries only cover errors before a claim and database/queue errors; dead-letter queue must be monitored manually.

500 incoming events/day is a conservative application cap, NOT an account-wide cost guarantee. Queue retries and dead-letter operations count too; shared existing workloads still consume free quotas. Queues Free has 10,000 operations/day and 24-hour retention; roughly 3 operations per successful queued event before retries. Free capacity is finite. Duplicate ingress counts against the cap. D1 budgets and delivery IDs require periodic retention review; do not delete delivery claims while a comment could still be eligible.

No raw comment text is stored in D1 or logged. Queue retains comment text up to its retention period. AI is disabled and no AI model is invoked; fixed approved replies avoid extra usage and unreviewed content. AI-enabled response generation remains deferred.

## Activation checklist

Run signed test webhook through deployed queue/D1 with a test account and confirm simulated delivery. Verify a real comment webhook shape (including media_product_type and timestamp), rejection of invalid signatures, duplicate delivery, per-post isolation and failure handling. Check free consumption again. Only then switch MODE=live AND SEND_ENABLED=true, initially for a dedicated test post; validate actual delivery before enabling campaign posts. Kill switch: SEND_ENABLED=false. Do not claim production readiness from unit tests alone.

## Official references checked 2026-11-25

- https://developers.facebook.com/documentation/instagram-platform/private-replies — one private reply/comment, seven days; follow-ups only after recipient response within 24 hours.
- https://developers.cloudflare.com/queues/platform/pricing/ — Free operations and retention.
- https://developers.cloudflare.com/queues/platform/limits/

No official public Broadcast Channels publishing API was found in the checked documentation. Channel sending is unsupported here. No browser automation or unofficial Instagram endpoints are used to bypass restrictions.

## Deployment evidence — 2026-11-25

Published https://pv-instagram-simulation.cantarinosministries.workers.dev with MODE=simulation and SEND_ENABLED=false. Dedicated D1 and both queues created on Free. Nine local tests and SQLite simulation passed. Remote signed synthetic events returned 200, forged signature 401, duplicate webhook generated only two simulated deliveries for two synthetic accounts. Synthetic rules/accounts subsequently disabled; temporary signing secret removed. Official Meta secret and verification token still need setup. New Meta app TPV Spirit Automations (1124482013517132) created by user; User connected the business portfolio. The three authorized permissions instagram_basic, instagram_manage_comments and instagram_manage_messages are ready for testing in Meta. Account consent, official secrets and webhook registration remain pending.

## Meta webhook verification — 2026-11-25

META_APP_SECRET was saved directly by the user in Cloudflare. META_VERIFY_TOKEN was generated and saved as an encrypted secret without exposing its value. Meta verified the callback successfully, comments v27.0 subscription is enabled, and the Meta dashboard sample webhook test reported success. GRAPH_VERSION is now v27.0, matching the dashboard and official Unified Login getting-started guide. Tester invitations sent with explicit user authorization to @ocantarino and @thepropheticvoices. Consent/token setup and real post rules remain pending. No sends enabled.
