#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

printf '%s\n' "scripts/install-native.sh is kept for compatibility; using scripts/install.sh."
exec "$ROOT_DIR/scripts/install.sh" "$@"
