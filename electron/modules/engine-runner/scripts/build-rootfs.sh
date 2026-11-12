#!/usr/bin/env bash
# Builds assets/macos-arm64/rootfs.ext4: an Alpine (arm64) root filesystem with
# Node.js (JS + TS), Python 3, gcc and g++ and the AlgoVault guest agent.
#
# Needs Docker and internet access, but only while building. The image it
# produces is shipped with the app and booted offline with `-nic none`.
#
#   ./scripts/build-rootfs.sh            # build
#   ./scripts/build-rootfs.sh --no-cache # force fresh package download
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
OUT_DIR="$ROOT/assets/macos-arm64"
TMP_OUT="$(mktemp -d)"
trap 'rm -rf "$TMP_OUT"' EXIT

command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }

echo "==> Building rootfs image with Docker (linux/arm64)"
DOCKER_BUILDKIT=1 docker build \
  --platform linux/arm64 \
  --target export \
  --output "type=local,dest=$TMP_OUT" \
  "$@" \
  "$ROOT/guest"

mkdir -p "$OUT_DIR"
mv -f "$TMP_OUT/rootfs.ext4" "$OUT_DIR/rootfs.ext4"

(cd "$OUT_DIR" && shasum -a 256 rootfs.ext4 > rootfs.ext4.sha256)

echo "==> Done: $OUT_DIR/rootfs.ext4 ($(du -h "$OUT_DIR/rootfs.ext4" | cut -f1))"
echo "    Test it with: node $ROOT/scripts/smoke-test.ts"

