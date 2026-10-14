# Private PowerAgent authentication — setup required

This commit adds a real **server-side Cloudflare Access JWT verification endpoint** and a private-login landing page. **It does not automatically provision Cloudflare Access, Codespaces APIs, or remote browser streaming.** Until you configure Access, `/api/private/me` fails closed.

## Owner setup in Cloudflare Zero Trust

1. In Cloudflare Zero Trust, configure an Access application protecting **both** `/cloud-login.html` and `/api/private/*` on your Pages domain. Limit access to the owner's identity only; use a strong identity provider with MFA. For broad site privacy, protect the entire Pages site instead.
2. Obtain the Access application's AUD tag and your Zero Trust team domain (e.g. `yourteam.cloudflareaccess.com`).
3. In Cloudflare Pages project Settings → Variables and Secrets, set:
   - `CF_ACCESS_TEAM_DOMAIN`: team domain or team name (no https://)
   - `CF_ACCESS_AUD`: the Access application AUD tag
   - `POWERAGENT_OWNER_EMAIL`: your authorized login email
4. Redeploy Pages and sign in through Cloudflare Access. Visit `/api/private/me` to confirm `authenticated:true`.
5. Ensure the Access policy protects the login page **and** the API endpoint. If they use different Access applications, their AUD tags differ; use one shared application or adapt validation.
6. Do not share account credentials or add GitHub personal access tokens to frontend scripts.

## Security boundary and missing integration

Cloudflare Access protects Pages endpoints and can provide private identity-based login. The current browser runs on **GitHub Codespaces**. Private Codespaces ports still require GitHub authorization; this landing page does not magically replace GitHub login for the browser port. Truly GitHub-free remote browser access would require a separate authenticated reverse proxy/streaming backend, secure session controls, and server-side GitHub API credentials. Those are not configured.

Do not switch Codespaces port visibility to Public to bypass login: it would expose the browser desktop. Cloudflare Pages cannot proxy an arbitrary Codespaces WebSocket browser session automatically. This setup is a secure foundation, not a complete single-login system.
