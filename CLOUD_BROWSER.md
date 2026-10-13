# PowerAgent Cloud Browser — private, on-demand prototype

This is **real remote Chromium**, not a simulated Windows desktop. It runs in a GitHub Codespace (remote Linux container), with its browser interface served by linuxserver/webtop. The local PC does not host Chromium.

## Start (no local installation)

1. Sign in to GitHub with your own account. Open the repository `salman00101/poweragent-ai-v5`.
2. Select **Code → Codespaces → Create codespace on main**. GitHub creates the remote development environment; the devcontainer starts the Chromium webtop container automatically.
3. Open the **Ports** tab in Codespaces. Find port **3000**, ensure its visibility is **Private**, and select **Open in Browser**.
4. Sign in to GitHub when prompted. The browser desktop should open. You can use it from another device signed into the same GitHub account.
5. Stop the Codespace from GitHub's Codespaces dashboard when finished to avoid consuming usage allowance. Delete the Codespace when you want to discard the remote browser and data.

## Important limitations

- GitHub Codespaces has free monthly usage allowances for eligible accounts; it is **not unlimited**, and paid usage may require a payment method or approval. Check GitHub's current limits before creating a Codespace.
- Codespace creation can take several minutes. Performance and available regions depend on GitHub's machines and policies. Arbitrary country/IP selection is **not supported**.
- This is Linux Chromium, **not Windows RDP**. It can run independently of your own PC, but only while the Codespace is running.
- Browser profile files are stored in a Docker volume **inside the Codespace**; stopping normally preserves them, deleting the Codespace destroys them. Do not assume permanent storage.
- Do not change forwarded port 3000 to **Public**. Private GitHub port forwarding is the access control. Use 2FA/passkeys on your GitHub account.
- On a shared/public device, use a private window, avoid saving credentials, sign out of GitHub and the remote browser, and close the window when done. A compromised public computer is never fully safe.
- This setup does **not** deploy Chromium on Cloudflare Pages. The Pages site can link to the Codespaces control panel, but it cannot start a Windows VM or host a full graphical Chromium process.
- Cloudflare dashboard login and secure automatic start/stop via GitHub API are **not implemented**. Never put a GitHub token in public frontend JavaScript.
- The Chromium container image is supplied by LinuxServer.io; review its documentation and keep it updated. Image startup and private port behavior must be tested in a real Codespace.
- The container binds port 3000 to loopback in the Codespace host; the GitHub Codespaces port-forwarding service is used for remote browser access.
