# Final zero-budget setup: Private Cloud Chromium

## Verified from Codespace terminal and Ports panel
- Existing container `devcontainer-browser-1` runs Chromium/webtop and publishes local TCP port 3000.
- Codespaces Ports panel forwards port 3000 via HTTPS with **Private** visibility.
- The isolated Docker TUN interface creation test passed, but this does **not** establish a usable VPN.
- Prior observed Codespace outbound IP was in the Netherlands; its location and assignment may change.

## Use
1. Start the existing Codespace in GitHub.
2. Open the **Ports** tab and select the forwarded HTTPS link for **3000**.
3. Sign in with your GitHub account when prompted.
4. Use Chromium inside the remote desktop. Websites opened *inside remote Chromium* use the remote server's outbound network, not a Windows/Android system-wide VPN.
5. When finished, stop the Codespace to conserve the free compute quota.

## Limits
- Not a full-device VPN on Windows or Android.
- No dedicated, exclusive, guaranteed static or rotating IP.
- Private forwarded ports require GitHub authentication; keep port 3000 Private.
- No permanent always-on service; Codespaces may stop on idle or quota exhaustion.
- GitHub personal accounts have monthly included compute and storage; usage beyond quota is not guaranteed free.
- Do not put secrets into terminal output or publicly expose the remote browser.
- A browser-based connection from Android may work, but was not verified in this project.
- Do not treat `vpn-status.html` or TUN diagnostics as proof that a VPN is deployed.

## Source documentation
- https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace
- https://docs.github.com/en/codespaces/reference/security-in-github-codespaces
- https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-included-usage
