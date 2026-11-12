#!/usr/bin/env bash
# Automates building all AlgoVault sandbox VM assets for macos-arm64 and macos-x64:
#   1. Linux Kernel ('Image') from Buildroot (/Users/jib/buildroot) via Docker
#   2. QEMU emulator binaries ('qemu-system-aarch64' & 'qemu-system-x86_64') from /Users/jib/src/qemu
#   3. Alpine Linux 'rootfs.ext4' disk images via ./build-rootfs.sh
#
# Usage:
#   ./electron/modules/engine-runner/scripts/build-vm-assets.sh                  # build all for arm64 + x64
#   ./electron/modules/engine-runner/scripts/build-vm-assets.sh --arch x64       # build only macos-x64
#   ./electron/modules/engine-runner/scripts/build-vm-assets.sh --arch arm64     # build only macos-arm64
#   ./electron/modules/engine-runner/scripts/build-vm-assets.sh --only-kernel    # build only kernel(s)
#   ./electron/modules/engine-runner/scripts/build-vm-assets.sh --only-qemu      # build only QEMU binaries
#   ./electron/modules/engine-runner/scripts/build-vm-assets.sh --only-rootfs    # build only rootfs.ext4
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

BUILDROOT_DIR="${BUILDROOT_DIR:-/Users/jib/buildroot}"
QEMU_SRC_DIR="${QEMU_SRC_DIR:-/Users/jib/src/qemu}"

TARGET_ARCH="all"
DO_KERNEL=1
DO_QEMU=1
DO_ROOTFS=1

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
    --only-kernel)
      DO_KERNEL=1; DO_QEMU=0; DO_ROOTFS=0
      shift
      ;;
    --only-qemu)
      DO_KERNEL=0; DO_QEMU=1; DO_ROOTFS=0
      shift
      ;;
    --only-rootfs)
      DO_KERNEL=0; DO_QEMU=0; DO_ROOTFS=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$ROOT/assets/macos-arm64" "$ROOT/assets/macos-x64"

should_build_arch() {
  local want="$1"
  [[ "$TARGET_ARCH" == "all" || "$TARGET_ARCH" == "$want" ]]
}

# --------------------------------------------------------------------------- #
# 1. Build Linux Kernel from Buildroot (/Users/jib/buildroot)
# --------------------------------------------------------------------------- #
build_kernel_for_arch() {
  local arch="$1"

  if [[ ! -d "$BUILDROOT_DIR" ]]; then
    echo "Error: Buildroot directory not found at $BUILDROOT_DIR" >&2
    exit 1
  fi

  if [[ "$arch" == "arm64" ]]; then
    local out_dir="$ROOT/assets/macos-arm64"
    # Reuse existing Buildroot arm64 Image if already built
    if [[ -f "$BUILDROOT_DIR/output/images/Image" ]]; then
      echo "==> Copying existing arm64 kernel from $BUILDROOT_DIR/output/images/Image"
      cp -f "$BUILDROOT_DIR/output/images/Image" "$out_dir/Image"
      return 0
    fi

    echo "==> Building arm64 Linux kernel from Buildroot ($BUILDROOT_DIR)..."
    docker run --rm \
      -v "$BUILDROOT_DIR:/buildroot" \
      -v "algovault-buildroot-aarch64:/buildroot-out" \
      -w /buildroot \
      ubuntu:24.04 bash -c '
        set -euo pipefail
        apt-get update && apt-get install -y \
          build-essential libncurses-dev bison flex libssl-dev libelf-dev \
          bc wget cpio unzip rsync file python3 git bzip2 xz-utils
        make O=/buildroot-out qemu_aarch64_virt_defconfig
        FORCE_UNSAFE_CONFIGURE=1 make O=/buildroot-out linux -j"$(nproc)"
        mkdir -p /buildroot/output-aarch64/images
        cp -f /buildroot-out/images/Image /buildroot/output-aarch64/images/Image
      '
    cp -f "$BUILDROOT_DIR/output-aarch64/images/Image" "$out_dir/Image"
    echo "==> Done: $out_dir/Image ($(du -h "$out_dir/Image" | cut -f1))"

  elif [[ "$arch" == "x64" ]]; then
    local out_dir="$ROOT/assets/macos-x64"
    echo "==> Building x86_64 Linux kernel from Buildroot ($BUILDROOT_DIR)..."

    # Ensure CONFIG_HW_RANDOM and CONFIG_HW_RANDOM_VIRTIO are built-in (=y)
    # because AlgoVault boots with a read-only Alpine rootfs without /lib/modules.
    local kcfg="$BUILDROOT_DIR/board/qemu/x86_64/linux.config"
    if grep -q "CONFIG_HW_RANDOM_VIRTIO=m" "$kcfg"; then
      sed -i.bak 's/CONFIG_HW_RANDOM_VIRTIO=m/CONFIG_HW_RANDOM=y\nCONFIG_HW_RANDOM_VIRTIO=y/' "$kcfg"
      rm -f "$kcfg.bak"
    fi

    # Build inside a native Linux Docker volume (/buildroot-out) instead of a macOS
    # VirtioFS bind mount. Extracting the Linux kernel over VirtioFS on case-insensitive
    # macOS APFS triggers GNU tar "Directory renamed before its status could be extracted"
    # and case-collision bugs.
    docker run --rm \
      -v "$BUILDROOT_DIR:/buildroot" \
      -v "algovault-buildroot-x86_64:/buildroot-out" \
      -w /buildroot \
      ubuntu:24.04 bash -c '
        set -euo pipefail
        apt-get update && apt-get install -y \
          build-essential libncurses-dev bison flex libssl-dev libelf-dev \
          bc wget cpio unzip rsync file python3 git bzip2 xz-utils
        rm -rf /buildroot/output-x86_64/build
        make O=/buildroot-out qemu_x86_64_defconfig
        FORCE_UNSAFE_CONFIGURE=1 make O=/buildroot-out linux -j"$(nproc)"
        mkdir -p /buildroot/output-x86_64/images
        cp -f /buildroot-out/images/bzImage /buildroot/output-x86_64/images/bzImage
      '
    cp -f "$BUILDROOT_DIR/output-x86_64/images/bzImage" "$out_dir/Image"
    echo "==> Done: $out_dir/Image ($(du -h "$out_dir/Image" | cut -f1))"
  fi
}

# --------------------------------------------------------------------------- #
# 2. Build QEMU System Binaries from /Users/jib/src/qemu
# --------------------------------------------------------------------------- #
build_qemu_for_arch() {
  local arch="$1"

  if [[ ! -d "$QEMU_SRC_DIR" ]]; then
    echo "Error: QEMU source directory not found at $QEMU_SRC_DIR" >&2
    exit 1
  fi

  if [[ "$arch" == "arm64" ]]; then
    local out_dir="$ROOT/assets/macos-arm64"
    local build_dir="$QEMU_SRC_DIR/build"
    if [[ ! -f "$build_dir/qemu-system-aarch64" ]]; then
      echo "==> Configuring and building qemu-system-aarch64 in $build_dir..."
      mkdir -p "$build_dir"
      (
        cd "$build_dir"
        ../configure --target-list=aarch64-softmmu --enable-hvf --disable-werror
        ninja -j"$(sysctl -n hw.ncpu)" qemu-system-aarch64
      )
    fi
    cp -f "$build_dir/qemu-system-aarch64" "$out_dir/qemu-system-aarch64"
    chmod +x "$out_dir/qemu-system-aarch64"
    echo "==> Done: $out_dir/qemu-system-aarch64 ($(du -h "$out_dir/qemu-system-aarch64" | cut -f1))"

  elif [[ "$arch" == "x64" ]]; then
    local out_dir="$ROOT/assets/macos-x64"
    local build_dir="$QEMU_SRC_DIR/build-x86_64"
    if [[ ! -f "$build_dir/qemu-system-x86_64" ]]; then
      echo "==> Configuring and building qemu-system-x86_64 in $build_dir..."
      mkdir -p "$build_dir"
      (
        cd "$build_dir"
        # Enable HVF when building on an x86_64 host; on arm64 host TCG is used for x86_64 emulation
        if [[ "$(uname -m)" == "x86_64" ]]; then
          ../configure --target-list=x86_64-softmmu --enable-hvf --disable-werror
        else
          ../configure --target-list=x86_64-softmmu --disable-werror
        fi
        ninja -j"$(sysctl -n hw.ncpu)" qemu-system-x86_64
      )
    fi
    cp -f "$build_dir/qemu-system-x86_64" "$out_dir/qemu-system-x86_64"
    chmod +x "$out_dir/qemu-system-x86_64"
    echo "==> Done: $out_dir/qemu-system-x86_64 ($(du -h "$out_dir/qemu-system-x86_64" | cut -f1))"
  fi
}

if [[ "$DO_KERNEL" -eq 1 ]]; then
  should_build_arch "arm64" && build_kernel_for_arch "arm64"
  should_build_arch "x64"   && build_kernel_for_arch "x64"
fi

if [[ "$DO_QEMU" -eq 1 ]]; then
  should_build_arch "arm64" && build_qemu_for_arch "arm64"
  should_build_arch "x64"   && build_qemu_for_arch "x64"
fi

if [[ "$DO_ROOTFS" -eq 1 ]]; then
  "$HERE/build-rootfs.sh" --arch "$TARGET_ARCH"
fi

echo ""
echo "==> All requested VM assets are ready:"
ls -lh "$ROOT/assets/macos-arm64" "$ROOT/assets/macos-x64" 2>/dev/null || true

