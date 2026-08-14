#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

if [ ! -f .next/standalone/server.js ]; then
  printf '%s\n' "Production build not found. Run 'npm run build' first." >&2
  exit 1
fi

mkdir -p .next/standalone/.next/static .next/standalone/public
cp -R .next/static/. .next/standalone/.next/static/
cp -R public/. .next/standalone/public/

exec node .next/standalone/server.js
