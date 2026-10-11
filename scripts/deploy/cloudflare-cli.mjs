import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

export const root = resolve(import.meta.dirname, "../..");

export function cloudflareCommand(command, { body, json = true, cwd = root } = {}) {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID?.trim())
    throw new Error("CLOUDFLARE_ACCOUNT_ID is required.");
  if (!process.env.CLOUDFLARE_API_TOKEN?.trim() && !process.env.WEBSITE_CF_PROFILE?.trim())
    throw new Error("CLOUDFLARE_API_TOKEN or WEBSITE_CF_PROFILE is required.");
  const args = ["exec", "cf", ...command];
  if (!process.env.CLOUDFLARE_API_TOKEN?.trim())
    args.push("--profile", process.env.WEBSITE_CF_PROFILE);
  const temp = body === undefined ? null : mkdtempSync(join(tmpdir(), "website-cf-"));
  try {
    if (temp) {
      const file = join(temp, "body.json");
      writeFileSync(file, JSON.stringify(body), { mode: 0o600 });
      args.push("--body", `@${file}`);
    }
    const result = spawnSync("pnpm", args, {
      cwd,
      env: process.env,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    });
    if (result.error || result.status !== 0)
      throw new Error(
        `cf ${command.slice(0, 3).join(" ")} failed; output suppressed to protect credentials.`,
      );
    if (!json) return result.stdout;
    try {
      return JSON.parse(result.stdout);
    } catch {
      throw new Error("cf returned invalid JSON; output suppressed.");
    }
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true });
  }
}
