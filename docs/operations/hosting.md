# Website hosting

The website uses Cloudflare Workers Static Assets. The home page, About page,
styles, rotating quotes, favicon, robots file, and email links are served as
static files. There is no Worker script, server process, paid service, or
runtime binding. Static asset requests and storage are free under
[Cloudflare's published policy](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).

The existing public destination is `https://www.rebuildingus.org`. The apex
continues to redirect there with status 307, preserving the path and query.
`/about` stays extensionless, and unknown paths return 404. The zone redirect
rule is `website_apex_to_www` in the `http_request_dynamic_redirect` phase.
The existing HTML canonical tags are preserved from the prior site.

## Deploy

The default path is `.github/workflows/deploy-cloudflare.yml`. Pushes to `main`
build, deploy, and verify the website. The same workflow accepts a manual
`rollback_version` UUID to restore a retained Cloudflare version. Deployments
serialize through the `website-production` concurrency group. Pull requests do
not receive production credentials.

The `production` GitHub environment holds `CLOUDFLARE_API_TOKEN`. Its permissions
are Workers Scripts Write and Account Settings Read for the website account;
Workers Routes Write, Zone Read, and DNS Write for the `rebuildingus.org` zone.
Cloudflare's Workers script permission applies to the account, so it is not
limited to this individual Worker. Never put the token in source, command-line
arguments, logs, or release artifacts.

A local operator can use an existing Cloudflare OAuth profile:

```sh
pnpm install --frozen-lockfile
export CLOUDFLARE_ACCOUNT_ID=e34437d6da60fe58537bafc5eb760cfc
export WEBSITE_CF_PROFILE=atlas
pnpm run deploy
```

For token authentication, supply `CLOUDFLARE_API_TOKEN` through the environment
instead of setting a profile. Every Cloudflare provider operation uses the
pinned new `cf` CLI; no Wrangler command or raw provider HTTP request is needed.
The generated Build Output Specification is parsed by Cloudflare's own utility
before deployment. Vite remains the page builder.

The public candidate URL is
`https://rebuilding-america-website.rebuildingus.workers.dev`.
`pnpm deploy:candidate` deploys a candidate before the first cutover. It refuses
to run when the production hostnames already use Cloudflare.
For ordinary releases, use `pnpm run deploy` so both production domains stay attached.

## Initial cutover and Vercel recovery

Run `pnpm deploy:candidate`, inspect both pages, and then run
`pnpm hosting:cutover`. The cutover command captures the three original Vercel
routing records in `.cloudflare/dns-rollback.json`, verifies the candidate,
preserves the apex redirect, and attaches the production domains to the exact
verified Worker version. It compares non-routing DNS before and after the
switch so mail and verification records stay intact. Cloudflare requires the
conflicting Vercel routing records to be removed before attaching a custom
domain; attachment failures restore the captured records automatically.

Preserve the ignored `.cloudflare/dns-rollback.json`,
`.cloudflare/redirect-rollback.json`, and Vercel response snapshots outside the
checkout before retiring it. These files contain recovery evidence, not tokens.
Do not delete the Vercel project or shared subscription during migration.

To return the public hostnames to the retained Vercel deployment:

```sh
pnpm hosting:rollback
```

This removes the production Worker custom domains and restores only the
captured website routing DNS records. Existing MX/TXT records remain intact.
The apex redirect rule can remain: restored Vercel DNS is unproxied, so that
rule does not intercept Vercel traffic. Verify public responses after DNS
propagation. The retained `vercel.json` keeps clean URLs available for recovery.

To restore a Cloudflare release while retaining the public domains:

```sh
pnpm hosting:rollback-version <retained-version-uuid>
```

## Verification

`pnpm hosting:verify https://www.rebuildingus.org` checks both pages, stylesheet,
JavaScript and favicon requests, email links, the robots file, and unknown-route
404 behavior. `pnpm hosting:cutover` also verifies the apex 307 redirect and query
preservation. Inspect the browser after deployment to confirm typography, layout,
rotating quotes, and About navigation. A new custom domain can require DNS and
certificate propagation; verify the actual public hostname before claiming the
cutover complete.

Vercel Analytics was removed because its same-origin collection endpoint is not
available on Cloudflare. This migration does not introduce a replacement
third-party tracker.
