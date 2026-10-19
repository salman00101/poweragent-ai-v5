#!/usr/bin/env sh
# Read-only host checks and ephemeral isolated container TUN test.
# No host network, routes, DNS, ports, Chromium containers, or secrets modified.
set -u
printf '%s\n' '=== VPN readiness diagnostic ==='
printf 'Codespace: %s\n' "${CODESPACE_NAME:-unknown}"
printf '%s\n' '=== Docker availability ==='
if ! command -v docker >/dev/null 2>&1; then echo 'Docker unavailable'; exit 1; fi
docker version --format 'Docker server: {{.Server.Version}}' || exit 1
printf '%s\n' '=== Temporary isolated TUN interface test ==='
docker run --rm --network none --cap-add NET_ADMIN --device /dev/net/tun alpine:3.20 sh -eu -c '
  test -c /dev/net/tun
  ip tuntap add dev vpn-test mode tun
  ip link set vpn-test up
  ip link show vpn-test
  ip link delete vpn-test
  echo "TUN interface creation: PASS"
' || { echo 'TUN interface creation: FAIL'; exit 1; }
printf '%s\n' '=== Existing browser container status ==='
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
printf '%s\n' '=== Important limitations ==='
echo 'PASS does not establish a reachable public VPN endpoint.'
echo 'Codespaces forwarding and dedicated/static international IP are NOT verified.'
echo 'No VPN is installed or activated by this diagnostic.'
