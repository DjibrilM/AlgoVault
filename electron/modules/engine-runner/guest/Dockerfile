# Builds the AlgoVault sandbox root filesystem as a raw ext4 image.
# Internet is only needed here, at build time. The resulting image is fully
# self-contained and the VM runs without any network device.
#
# Usage: see ../scripts/build-rootfs.sh

ARG ALPINE_VERSION=3.22

# --------------------------------------------------------------------------- #
# 1. The guest filesystem
# --------------------------------------------------------------------------- #
FROM alpine:${ALPINE_VERSION} AS rootfs

RUN apk add --no-cache \
        tini \
        python3 \
        nodejs \
        gcc g++ musl-dev \
    && adduser -D -H -h /tmp -s /sbin/nologin -u 1000 runner \
    && rm -rf /var/cache/apk/* /usr/share/man /usr/share/doc \
    # strip Python parts that are useless in a headless sandbox
    && rm -rf /usr/lib/python3*/test /usr/lib/python3*/idlelib /usr/lib/python3*/tkinter

COPY agent.py /opt/algovault/agent.py
COPY --chmod=755 init /sbin/algovault-init

# Pre-compile the agent so a read-only root does not matter.
RUN python3 -m py_compile /opt/algovault/agent.py

# --------------------------------------------------------------------------- #
# 2. Pack it into an ext4 image (done inside Linux so ownership/modes are kept)
# --------------------------------------------------------------------------- #
FROM alpine:${ALPINE_VERSION} AS imager
RUN apk add --no-cache e2fsprogs e2fsprogs-extra
COPY --from=rootfs / /rootfs
RUN set -eu; \
    rm -f /rootfs/.dockerenv; \
    for d in proc sys dev tmp run; do rm -rf "/rootfs/$d"; mkdir -p "/rootfs/$d"; done; \
    chmod 1777 /rootfs/tmp; \
    echo sandbox > /rootfs/etc/hostname; \
    printf '127.0.0.1\tlocalhost sandbox\n::1\tlocalhost sandbox\n' > /rootfs/etc/hosts; \
    : > /rootfs/etc/resolv.conf; \
    size_mb=$(du -sm /rootfs | cut -f1); \
    img_mb=$(( size_mb * 115 / 100 + 32 )); \
    mke2fs -q -t ext4 -O ^has_journal -L algovault -m 0 -E root_owner=0:0 \
        -d /rootfs /rootfs.ext4 "${img_mb}M"; \
    e2fsck -fy /rootfs.ext4 >/dev/null || [ $? -le 1 ]; \
    resize2fs -M /rootfs.ext4 >/dev/null 2>&1; \
    echo "rootfs: ${size_mb}MB of files -> $(du -m /rootfs.ext4 | cut -f1)MB image"

# --------------------------------------------------------------------------- #
# 3. Export just the image file
# --------------------------------------------------------------------------- #
FROM scratch AS export
COPY --from=imager /rootfs.ext4 /rootfs.ext4
