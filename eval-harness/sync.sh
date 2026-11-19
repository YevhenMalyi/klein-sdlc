#!/bin/sh
# Copies the plugin's content into the harness. Copies, not symlinks: the eval sandbox
# refuses reads that resolve outside the plugin directory.
set -eu
cd "$(dirname "$0")"
for p in skills agents docs templates scripts REVIEW.md TRACKING.md; do
  rm -rf "$p"
  cp -R "../$p" "$p"
done
