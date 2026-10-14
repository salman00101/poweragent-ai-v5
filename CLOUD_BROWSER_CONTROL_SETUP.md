# PowerAgent cloud browser control (prototype)

The authenticated dashboard at /private-dashboard.html now has **Start browser** and **Stop browser** controls, backed by /api/cloud-browser. This starts/stops an existing GitHub Codespace in the repository salman00101/poweragent-ai-v5. It does **not** provide browser video streaming or remove GitHub authentication from private port 3000.

## Owner-only one-time configuration
1. In GitHub settings, generate a token with Codespaces lifecycle permissions. For a classic PAT, GitHub documents the `codespace` scope; prefer a fine-grained token with only the needed Codespaces lifecycle permissions if supported for your account. Keep it private, never commit or send it in chat.
2. Cloudflare Pages project > Settings > Variables and secrets > add `POWERAGENT_GITHUB_TOKEN` as encrypted **Secret** in Production.
3. Redeploy Pages so the Function receives the new secret.
4. The owner must have an existing Codespace belonging to `salman00101/poweragent-ai-v5`. The API deliberately does not create new Codespaces or expose private ports publicly.
5. Sign into PowerAgent with password and TOTP, then test Start/Stop. API returns a clear configuration error until the secret is set.

## Limitations and safety
- GitHub private forwarded ports still require GitHub authentication. Never set port 3000 to public to work around this. GitHub states private port authentication cookies expire periodically.
- A token can be revoked or expire; authorization is not guaranteed forever.
- Logout **requests** a Codespace stop before clearing the session. Stop can fail or take time. Closing the tab, losing connection, or session expiry does not automatically stop the Codespace. Check Codespaces status to avoid consuming free quota.
- Cloudflare Pages alone cannot proxy a full interactive Chromium desktop from a private Codespaces port without additional secure infrastructure.
- No distributed login rate limiting is configured. This is not production-hardened.
- Free Codespaces quota and idle timeout limits apply.
