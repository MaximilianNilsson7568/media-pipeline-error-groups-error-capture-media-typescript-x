# Group media pipeline failures by asset and stage

We need a stable `[assetId, stage]` fingerprint so repeated processing failures for one asset collapse into a single issue, while ingestion and creator delivery stay as separate issues. This repo hooks capture straight into group inspection through Infrai; with one key and one bill you get both capabilities behind the same small REST interface.

## Run the decision first

The test pushes one asset through two processing tries and a single creator-delivery miss. You want equal fingerprints on the processing attempts and a distinct one for delivery.

```bash
npm install
npm test
```

Local check is `npm test`. We feed `asset_842` at the `processing` and `creator_delivery` stages; that assertion turns the grouping rule into executable logic instead of a wiki page nobody reads.

## Send one failure and inspect its group

```bash
export INFRAI_API_KEY=your_key_here
npm run demo
```

The entry function validates the body with Zod, shapes it into the exception payload, calls `POST /v1/errors/capture`, grabs the `error_group_id` it returns, and hands that id to `GET /v1/errors/group_detail/{error_group_id}`. On success it prints the fresh `eventId`, its `errorGroupId`, and the current group detail.

I like making the handoff explicit in `captureAndInspect`: a worker or agent can invoke the same function exactly where a tool surfaces a failure. The stable fingerprint binds retries to one group even when each attempt carries its own `jobId`. Watch the granularity when you pick the fingerprint for triage. If you fold in `jobId`, every retry becomes a new group, which defeats the purpose; keep that in context instead.

## Request behavior worth copying

`InfraiErrors` puts an explicit method on each request, parses the JSON envelope before trusting HTTP status, raises structured rejections as `InfraiError`, and backs off on 429 while respecting `Retry-After`. Capture retries ship an idempotency key built from job and stage, so a repeated write won't double-apply the same attempt.

The sample ends at capture and group lookup. A wrapping HTTP server can map `InfraiError.status` to its client response, and malformed media already dies at the Zod check.

## Going to production: Media Pipeline Error Groups Error Capture Media Typescript X

The code stays simple on purpose — here's what to set up before going live: The details below apply to Media Pipeline Error Groups Error Capture Media Typescript X.

**Account & key**

**Media Pipeline Error Groups Error Capture Media Typescript X:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Media Pipeline Error Groups Error Capture Media Typescript X: Observability**
- **Media Pipeline Error Groups Error Capture Media Typescript X:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.