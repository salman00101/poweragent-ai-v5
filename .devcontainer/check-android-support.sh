#!/usr/bin/env bash
# Read-only Android runtime compatibility test. Does not modify the Codespace.
set -u
echo "=== Android on Codespaces: host compatibility ==="
echo "Kernel: $(uname -r)"
echo "Architecture: $(uname -m)"
echo
echo "=== KVM device ==="
if [ -e /dev/kvm ]; then ls -l /dev/kvm; else echo "MISSING /dev/kvm"; fi
echo
echo "=== Android binder support ==="
if [ -d /dev/binderfs ]; then ls -la /dev/binderfs | head -12; else echo "No /dev/binderfs"; fi
for p in /dev/binder /dev/hwbinder /dev/vndbinder; do
  if [ -e "$p" ]; then ls -l "$p"; else echo "MISSING $p"; fi
done
grep -w binder /proc/filesystems || true
echo
echo "=== Docker access ==="
docker info --format 'Docker server: {{.ServerVersion}}' 2>&1 || true
echo
echo "=== Available memory ==="
free -h | head -3
echo
echo "=== Available disk ==="
df -h . | tail -1
echo
echo "This script only checks prerequisites; it does not install Android."
