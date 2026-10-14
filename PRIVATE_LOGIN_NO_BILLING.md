# PowerAgent owner login without Cloudflare Zero Trust billing

A prototype is at `/private-dashboard.html`. It uses **password + TOTP**, server-side PBKDF2 password verification, signed HttpOnly Secure SameSite cookies (1 hour), and fail-closed secrets configuration. **The HTML page is publicly viewable**; authenticated data must always be protected by server-side checks. Existing Codespaces ports remain private and GitHub-authenticated.

## Before enabling publicly

- Set up Cloudflare WAF rate limiting on `/api/auth/login` (e.g. low failed-attempt threshold) and bot protection. **No distributed rate limiting is implemented in this prototype**, so do not rely on it for sensitive data until this is configured.
- Choose a strong unique password and TOTP secret, never store them in GitHub or frontend JavaScript.
- Do not use public devices you do not trust for sensitive sign-ins; keyloggers can capture passwords.
- The authentication implementation has not been penetration-tested. Use at your own risk.

## Generate owner secrets locally

Run this Node.js 20+ script on a trusted computer (not a shared/public PC). It prints four secrets; copy them directly into Cloudflare Pages **Settings → Variables and Secrets**, marking each as encrypted/secret. Do not commit outputs or paste them into chat.

```js
const crypto=require('node:crypto');
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32(bytes){let bits=0,v=0,out='';for(const b of bytes){v=(v<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(v>>>(bits-=5))&31]}}if(bits)out+=alphabet[(v<<(5-bits))&31];return out}
const password=process.env.POWERAGENT_OWNER_PASSWORD;
if(!password||password.length<16)throw Error('Set POWERAGENT_OWNER_PASSWORD to a unique 16+ character password');
const salt=crypto.randomBytes(16);
console.log('POWERAGENT_PASSWORD_SALT='+salt.toString('base64url'));
console.log('POWERAGENT_PASSWORD_HASH='+crypto.pbkdf2Sync(password,salt,210000,32,'sha256').toString('base64url'));
console.log('POWERAGENT_SESSION_SECRET='+crypto.randomBytes(32).toString('base64url'));
const totp=b32(crypto.randomBytes(20));
console.log('POWERAGENT_TOTP_SECRET='+totp);
console.log('Authenticator manual setup secret: '+totp);
```

Configure the authenticator app with TOTP SHA-1, six digits, 30-second interval. Keep the TOTP secret private. Redeploy Cloudflare Pages after setting secrets.

**Caution:** The shell command used to set `POWERAGENT_OWNER_PASSWORD` can enter shell history; use a secure local input method. Never send the password or generated secrets to ChatGPT.

## What this does not do

- It does not protect the existing `/api/build`, `/api/chat`, or the whole site; protect each sensitive endpoint separately with server-side `authorized(request,env)` before enabling private data.
- It does not integrate GitHub Codespaces start/stop, and cannot open a private Codespaces port without GitHub authentication.
- It does not replace GitHub login or provide one-click cloud browser access.
