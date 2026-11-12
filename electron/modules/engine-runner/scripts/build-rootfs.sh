#!/usr/bin/env bash
# Builds Alpine Linux rootfs.ext4 images for AlgoVault's sandbox VM:
#   - assets/macos-arm64/rootfs.ext4 (linux/arm64)
#   - assets/macos-x64/rootfs.ext4   (linux/amd64)
#
# Each image includes Node.js (JS + TS), Python 3, gcc, g++, tini, and the
# AlgoVault guest agent.
#
# Needs Docker and internet access, but only while building. The images it
# produces are shipped with the app and booted offline with `-nic none`.
#
# Usage:
#   ./scripts/build-rootfs.sh                    # builds both arm64 and x64
#   ./scripts/build-rootfs.sh --arch arm64       # builds only macos-arm64
#   ./scripts/build-rootfs.sh --arch x64         # builds only macos-x64
#   ./scripts/build-rootfs.sh --no-cache         # force fresh package download
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

TARGET_ARCH="all"
DOCKER_ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --arch)
      TARGET_ARCH="${2:-}"
      shift 2
      ;;
    --arch=*)
      TARGET_ARCH="${1#*=}"
      shift
      ;;
    *)
      DOCKER_ARGS+=("$1")
      shift
      ;;
  esac
done

command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }

build_for_arch() {
  local arch="$1"
  local docker_platform=""
  local out_dir=""

  case "$arch" in
    arm64|aarch64)
      docker_platform="linux/arm64"
      out_dir="$ROOT/assets/macos-arm64"
      ;;
    x64|x86_64|amd64)
      docker_platform="linux/amd64"
      out_dir="$ROOT/assets/macos-x64"
      ;;
    *)
      echo "Unsupported architecture: $arch (expected arm64, x64, or all)" >&2
      exit 1
      ;;
  esac

  local tmp_out
  tmp_out="$(mktemp -d)"

  echo "==> Building rootfs image with Docker ($docker_platform) -> $out_dir"
  DOCKER_BUILDKIT=1 docker build \
    --platform "$docker_platform" \
    --target export \
    --output "type=local,dest=$tmp_out" \
    ${DOCKER_ARGS[@]+"${DOCKER_ARGS[@]}"} \
    "$ROOT/guest"

  mkdir -p "$out_dir"
  mv -f "$tmp_out/rootfs.ext4" "$out_dir/rootfs.ext4"
  rm -rf "$tmp_out"

  (cd "$out_dir" && shasum -a 256 rootfs.ext4 > rootfs.ext4.sha256)

  echo "==> Done: $out_dir/rootfs.ext4 ($(du -h "$out_dir/rootfs.ext4" | cut -f1))"
}

if [[ "$TARGET_ARCH" == "all" ]]; then
  build_for_arch "arm64"
  build_for_arch "x64"
else
  build_for_arch "$TARGET_ARCH"
fi

echo "    Test with: node $ROOT/scripts/smoke-test.ts"


