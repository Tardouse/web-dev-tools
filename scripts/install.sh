#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

printf '%s\n' "Using the Docker-free installer at scripts/install-native.sh."
exec "$ROOT_DIR/scripts/install-native.sh" "$@"
