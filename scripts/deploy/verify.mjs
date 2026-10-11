import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./cloudflare-cli.mjs";

export async function verify(origin, { compareBuild = true } = {}) {
  if (!origin || !/^https:\/\/[a-z0-9.-]+$/.test(origin))
    throw new Error("An explicit HTTPS origin is required.");
  let count = 0;
  for (const path of ["/", "/about"]) {
    const response = await fetch(origin + path);
    const html = await response.text();
    if (response.headers.get("server") !== "cloudflare" || response.headers.has("x-vercel-id"))
      throw new Error(`Public traffic has not reached Cloudflare: ${path}`);
    if (compareBuild) {
      const expected = readFileSync(
        join(root, "dist", path === "/" ? "index.html" : "about.html"),
        "utf8",
      );
      const normalize = (value) =>
        value.replace(/<script>[\s\S]*?<\/script>/g, "").replace(/\s+</g, "<");
      if (normalize(html) !== normalize(expected))
        throw new Error(`Public page differs from the verified release: ${path}`);
    }
    if (
      response.status !== 200 ||
      !response.headers.get("content-type")?.includes("text/html") ||
      !html.includes("Rebuilding America") ||
      !html.includes("mailto:hello@rebuildingus.org")
    )
      throw new Error(`Page acceptance failed: ${path}`);
    if (html.includes("/_vercel/") || html.includes("/src/analytics.js"))
      throw new Error("Vercel analytics remains in the release.");
    const assets = [...html.matchAll(/(?:src|href)="(\/(?:assets\/[^"#?]+|favicon\.svg))"/g)].map(
      (m) => m[1],
    );
    if (!assets.some((p) => p.endsWith(".css"))) throw new Error(`Missing styles for ${path}`);
    for (const asset of new Set(assets)) {
      const r = await fetch(origin + asset);
      if (!r.ok) throw new Error(`Asset acceptance failed: ${asset}`);
      const actual = Buffer.from(await r.arrayBuffer());
      if (compareBuild && !actual.equals(readFileSync(join(root, "dist", asset))))
        throw new Error(`Asset differs from the verified release: ${asset}`);
      count++;
    }
  }
  const missing = await fetch(origin + "/missing-page-hosting-verification");
  if (missing.status !== 404) throw new Error("Unknown routes must return 404.");
  const robots = await fetch(origin + "/robots.txt");
  if (!robots.ok) throw new Error("robots.txt is unavailable.");
  console.log(JSON.stringify({ origin, pages: 2, assets: count, unknownRoute: 404, robots: true }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await verify(process.argv[2]);
