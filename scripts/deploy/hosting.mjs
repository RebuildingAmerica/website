import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readBuildOutput } from "@cloudflare/build-output-utils";
import { cloudflareCommand as cf, root } from "./cloudflare-cli.mjs";
import { verify } from "./verify.mjs";

const accountId = "e34437d6da60fe58537bafc5eb760cfc";
const zone = "fef647c33b8a3a993297da7dcb8909ec";
const worker = "rebuilding-america-website";
const candidate = "rebuilding-america-website.rebuildingus.workers.dev";
const domains = ["rebuildingus.org", "www.rebuildingus.org"];
const output = join(root, ".cloudflare/output/v0");
const snapshotFile = join(root, ".cloudflare/dns-rollback.json");
const save = (file, value) => {
  mkdirSync(join(root, ".cloudflare"), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
};
const routing = (rows) => rows.filter((r) => ["A", "AAAA", "CNAME"].includes(r.type));
const inventory = () =>
  domains.flatMap((name) =>
    cf(["dns", "records", "list", "--zone", zone, "--name", name, "--per-page", "100"]),
  );
const untouched = (rows) =>
  createHash("sha256")
    .update(
      JSON.stringify(
        rows
          .filter((r) => !["A", "AAAA", "CNAME"].includes(r.type))
          .map(({ id, name, type, content, priority, ttl }) => ({
            id,
            name,
            type,
            content,
            priority,
            ttl,
          }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      ),
    )
    .digest("hex");

async function prepare(production) {
  if (process.env.CLOUDFLARE_ACCOUNT_ID !== accountId)
    throw new Error("Cloudflare account does not match the website account.");
  rmSync(output, { recursive: true, force: true });
  mkdirSync(join(output, "workers/default"), { recursive: true });
  writeFileSync(
    join(output, "config.json"),
    JSON.stringify({ accountId, buildContext: { isPreview: false } }),
  );
  writeFileSync(
    join(output, "workers/default/worker.config.json"),
    JSON.stringify({
      name: worker,
      compatibilityDate: "2026-10-10",
      workersDev: true,
      previewUrls: false,
      domains: production ? domains : [],
      assets: {
        htmlHandling: "drop-trailing-slash",
        notFoundHandling: "none",
        runWorkerFirst: false,
      },
    }),
  );
  cpSync(join(root, "dist"), join(output, "workers/default/assets"), { recursive: true });
  await readBuildOutput(root);
}
function deployed() {
  const d = cf(["workers", "deployments", "list", "--worker", worker]);
  const version = d.deployments?.[0]?.versions;
  if (version?.length !== 1 || version[0].percentage !== 100)
    throw new Error("The website is not serving exactly one verified version.");
  return { deploymentId: d.deployments[0].id, versionId: version[0].version_id };
}
function capture() {
  if (existsSync(snapshotFile)) return JSON.parse(readFileSync(snapshotFile, "utf8"));
  const rows = inventory();
  const records = routing(rows);
  if (
    records.length !== 3 ||
    records.some((r) => r.proxied) ||
    !records.some((r) => r.type === "CNAME" && r.content.endsWith(".vercel-dns-017.com"))
  )
    throw new Error("Expected the original Vercel website DNS before capture.");
  const snapshot = {
    capturedAt: new Date().toISOString(),
    accountId,
    zone,
    worker,
    records,
    untouchedDigest: untouched(rows),
  };
  save(snapshotFile, snapshot);
  return snapshot;
}
function ensureRedirect() {
  const list = cf(["rulesets", "list", "--zone", zone]);
  const existing = list.find(
    (r) => r.phase === "http_request_dynamic_redirect" && r.kind === "zone",
  );
  if (existing) {
    const ruleset = cf(["rulesets", "get", existing.id, "--zone", zone]);
    if (!ruleset.rules?.some((r) => r.ref === "website_apex_to_www"))
      throw new Error("Review the existing redirect ruleset before changing it.");
    return { id: existing.id, created: false };
  }
  const result = cf(["rulesets", "create", "--zone", zone], {
    body: {
      name: "Website canonical hostname",
      kind: "zone",
      phase: "http_request_dynamic_redirect",
      rules: [
        {
          ref: "website_apex_to_www",
          description: "Preserve the website's www destination",
          expression: 'http.host eq "rebuildingus.org"',
          action: "redirect",
          action_parameters: {
            from_value: {
              status_code: 307,
              target_url: {
                expression: 'concat("https://www.rebuildingus.org", http.request.uri.path)',
              },
              preserve_query_string: true,
            },
          },
        },
      ],
    },
  });
  return { id: result.id, created: true };
}

const action = process.argv[2];
if (action === "prepare") await prepare(false);
else if (action === "candidate" || action === "deploy") {
  const production = action === "deploy";
  if (!production && routing(inventory()).some((row) => row.proxied))
    throw new Error("Production is already on Cloudflare; use pnpm run deploy.");
  if (production && !routing(inventory()).every((r) => r.proxied))
    throw new Error("Run hosting:cutover for the first production switch.");
  await prepare(production);
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  cf(["deploy", "--prebuilt", "--tag", sha, "--message", `Website ${sha}`], { json: false });
  const release = { ...deployed(), sha, origin: `https://${candidate}`, production };
  save(join(root, ".cloudflare/release.json"), release);
  await verify(release.origin);
  if (production) await verify("https://www.rebuildingus.org");
  console.log(JSON.stringify(release));
} else if (action === "cutover") {
  const snapshot = capture();
  await verify(`https://${candidate}`);
  const before = deployed();
  const redirect = ensureRedirect();
  save(join(root, ".cloudflare/redirect-rollback.json"), redirect);
  // The exact static bundle already verified above is attached to the public hosts.
  await prepare(true);
  const currentRecords = routing(inventory());
  if (
    currentRecords.length !== snapshot.records.length ||
    currentRecords.some(
      (row) =>
        !snapshot.records.some(
          (saved) =>
            saved.id === row.id && saved.content === row.content && saved.type === row.type,
        ),
    )
  )
    throw new Error("Website routing DNS changed after rollback capture.");
  for (const row of currentRecords)
    cf(["dns", "records", "delete", row.id, "--zone", zone, "--force"]);
  try {
    cf(["workers", "triggers", "deploy", "--prebuilt"], { json: false });
  } catch (error) {
    await prepare(false);
    cf(["workers", "triggers", "deploy", "--prebuilt"], { json: false });
    for (const row of snapshot.records) {
      const { name, type, content, ttl, proxied } = row;
      cf(["dns", "records", "create", "--zone", zone], {
        body: { name, type, content, ttl, proxied },
      });
    }
    throw error;
  }
  if (deployed().versionId !== before.versionId)
    throw new Error("Website version changed during domain attachment.");
  if (untouched(inventory()) !== snapshot.untouchedDigest)
    throw new Error("Non-routing DNS changed during the cutover.");
  await verify("https://www.rebuildingus.org");
  const redirectCheck = await fetch("https://rebuildingus.org/about?hosting=verify", {
    redirect: "manual",
  });
  if (
    redirectCheck.status !== 307 ||
    redirectCheck.headers.get("location") !== "https://www.rebuildingus.org/about?hosting=verify"
  )
    throw new Error("Apex redirect verification failed.");
  console.log(
    JSON.stringify({
      production: "https://www.rebuildingus.org",
      ...before,
      dnsRollback: snapshotFile,
    }),
  );
} else if (action === "rollback") {
  const snapshot = JSON.parse(readFileSync(snapshotFile, "utf8"));
  if (snapshot.accountId !== accountId || snapshot.zone !== zone || snapshot.worker !== worker)
    throw new Error("Rollback identity mismatch.");
  await prepare(false);
  cf(["workers", "triggers", "deploy", "--prebuilt"], { json: false });
  for (const row of routing(inventory()))
    cf(["dns", "records", "delete", row.id, "--zone", zone, "--force"]);
  for (const row of snapshot.records) {
    const { name, type, content, ttl, proxied } = row;
    cf(["dns", "records", "create", "--zone", zone], {
      body: { name, type, content, ttl, proxied },
    });
  }
  if (untouched(inventory()) !== snapshot.untouchedDigest)
    throw new Error("Non-routing DNS differs from rollback capture.");
  console.log(
    "Original Vercel DNS restored; verify public pages before retiring any Cloudflare resources.",
  );
} else if (action === "rollback-version") {
  const version = process.argv[3];
  if (!/^[a-f0-9-]{36}$/.test(version ?? ""))
    throw new Error("Supply the retained Cloudflare version UUID.");
  cf(["workers", "deployments", "create", "--worker", worker], {
    body: { strategy: "percentage", versions: [{ version_id: version, percentage: 100 }] },
  });
  if (deployed().versionId !== version) throw new Error("Rollback version readback failed.");
  await verify("https://www.rebuildingus.org", { compareBuild: false });
  console.log(JSON.stringify(deployed()));
} else throw new Error("Use prepare, candidate, deploy, cutover, rollback, or rollback-version.");
