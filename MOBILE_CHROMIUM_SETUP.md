# PowerAgent Chromium on Android — mobile setup

This guide applies to the existing `lscr.io/linuxserver/chromium:latest` Docker service, forwarded privately on Codespaces port 3000. It does not replace the image, expose the port publicly, or change the working desktop configuration.

## Start
1. On Android Chrome, sign in to GitHub using the same account that owns the Codespace.
2. Start the Codespace, open its **Ports** tab, and use the private forwarded HTTPS address for port **3000**. Bookmark that address while the Codespace is running; it may change when recreated.
3. Rotate the phone to **landscape**. Use Chrome's menu > **Desktop site** only if the remote-desktop controls do not fit or fail to appear. If desktop site makes everything too small, turn it off again.
4. Use full-screen mode if offered by the remote-desktop interface; hide mobile Chrome's toolbar where supported.

## Touch and keyboard
- The remote desktop may treat touch as mouse input, so tapping, dragging and scrolling may differ from normal mobile webpages. Look for the remote session's on-screen input/keyboard toolbar.
- Tap the remote Chromium address bar before invoking the remote session's keyboard button. If Android's keyboard does not appear, use the remote desktop toolbar's keyboard control if present.
- If touch remains imprecise, try a Bluetooth mouse/keyboard. This is optional, not required.
- If the remote desktop offers a touch-versus-mouse mode, test both. The exact controls depend on the running Chromium image/version.

## Display and performance
- Try landscape orientation first. Avoid excessive browser zoom; return Android Chrome zoom to default if taps become misaligned.
- Prefer a stable Wi-Fi connection and avoid multiple video-heavy tabs.
- The Codespace can have limited CPU/RAM. Heavy websites and high desktop resolutions may lag.
- If the session offers display quality, scaling or resolution controls, lower them for smoother mobile interaction. Do not assume these controls exist in every version.
- If the page is stuck, reload the forwarded port page once; do not delete the browser data volume or rebuild the Codespace just to fix input.

## Verify
Test in this order: (1) tap Chromium address bar, (2) type a URL, (3) scroll a page, (4) open and close a tab, (5) rotate the phone. Note which test fails and whether the remote desktop toolbar is visible.

## Known limits
The Linux desktop streamed into a mobile browser is not the same as a native Android Chromium app. GitHub Codespaces private forwarding still requires GitHub login. The remote browser's outbound IP is not dedicated or static. No mobile-specific image or container settings have been deployed by this guide.
