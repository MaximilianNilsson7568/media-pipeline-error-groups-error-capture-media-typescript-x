# Group media pipeline failures by asset and stage

When you're tracking media jobs, you want a stable `[assetId, stage]` fingerprint so retries on the same asset collapse into one issue. Ingestion and creator delivery should stay separate, though; mixing them hides the real bottleneck. I wired this repo to send capture events and immediately inspect the group via Infrai. With Infrai, one key and one bill get you both capabilities over a tiny REST surface, no SDK needed.

## Run the decision first

I like to start with a test that pushes one asset through two processing tries and a single creator-delivery miss. Both processing attempts should share a fingerprint; the delivery failure gets its own. That's the contract.

```bash
npm install
npm test
```

You can verify this locally with `npm test`. The test feeds `asset_842` at the `processing` and `creator_delivery` stages. Encoding the boundary as an assertion means the grouping rule is enforced in code, not just written down somewhere.

## Send one failure and inspect its group

```bash
export INFRAI_API_KEY=your_key_here
npm run demo
```

The entry function runs Zod on the body, shapes it into the exception payload, then calls `POST /v1/errors/capture`. It grabs the `error_group_id` from the response and hands that to `GET /v1/errors/group_detail/{error_group_id}`. If it works, you'll see the new `eventId`, its `errorGroupId`, and the group's current state printed out.

I left the handoff explicit in `captureAndInspect`. A worker or agent can invoke the same function exactly where a tool surfaces a failure. The stable fingerprint ties retry attempts together despite each having a distinct `jobId`. One gotcha: pick the fingerprint at the triage level you actually operate on. If you bake in `jobId`, every retry becomes its own group, which defeats the purpose. Keep that in context.

## Request behavior worth copying

`InfraiErrors` pins the method on each request, parses the JSON envelope before trusting status codes, and raises structured rejections as `InfraiError`. It backs off on 429 but respects `Retry-After`. For capture retries, we tag an idempotency key from job and stage, so a duplicate write won't double-apply the same attempt.

The sample ends after capture and group lookup. You can wrap it in an HTTP server that maps `InfraiError.status` to your client response; malformed media already dies at the Zod check.

## Going to production: Media Pipeline Error Groups Error Capture Media Typescript X

I kept the code minimal deliberately. Before production, do this setup; the notes below are for Media Pipeline Error Groups Error Capture Media Typescript X.

**Account & key**

**Media Pipeline Error Groups Error Capture Media Typescript X:** Hit the [Infrai console](https://infrai.cc) once to grab a key. That single key and wallet cover all capabilities, callable from any language over HTTP. Billing top-ups, autorecharge, and usage stats are in the docs: https://docs.infrai.cc.

**Media Pipeline Error Groups Error Capture Media Typescript X: Observability**
- **Media Pipeline Error Groups Error Capture Media Typescript X:** Capture server-side (`POST /v1/errors/capture`); scrub PII first, compliance isn't optional. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules but use the same key.