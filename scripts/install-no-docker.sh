#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

printf '%s\n' "Installing DevToolbox directly with Node.js (Docker is not used)."
exec "$ROOT_DIR/scripts/install-native.sh" "$@"
