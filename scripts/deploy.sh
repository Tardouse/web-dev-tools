#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

COMPOSE=${COMPOSE_COMMAND:-"docker compose"}
ENV_FILE=${ENV_FILE:-.env}
HEALTH_URL=${HEALTH_URL:-}
MAX_ATTEMPTS=${MAX_ATTEMPTS:-30}

if ! command -v docker >/dev/null 2>&1; then
  printf '%s\n' "Error: Docker is required. Install Docker Engine with the Compose plugin first." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  printf '%s\n' "Error: Docker is not running or the current user cannot access it." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  printf '%s\n' "Error: the Docker Compose plugin is required." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp .env.example "$ENV_FILE"
  printf '%s\n' "Created $ENV_FILE from .env.example. Review NEXT_PUBLIC_SITE_URL before public deployment."
fi

printf '%s\n' "Building and starting DevToolbox..."
# shellcheck disable=SC2086
$COMPOSE --env-file "$ENV_FILE" up -d --build --remove-orphans

if [ -z "$HEALTH_URL" ]; then
  PUBLISHED_PORT=$($COMPOSE --env-file "$ENV_FILE" port web 8886 | sed 's/.*://')
  HEALTH_URL="http://127.0.0.1:${PUBLISHED_PORT}/api/health"
fi

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if wget -qO- "$HEALTH_URL" >/dev/null 2>&1 || curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    printf '%s\n' "Deployment healthy: $HEALTH_URL"
    # shellcheck disable=SC2086
    $COMPOSE --env-file "$ENV_FILE" ps
    exit 0
  fi
  printf 'Waiting for health check (%s/%s)...\n' "$attempt" "$MAX_ATTEMPTS"
  sleep 2
  attempt=$((attempt + 1))
done

printf '%s\n' "Deployment failed its health check. Recent logs:" >&2
# shellcheck disable=SC2086
$COMPOSE --env-file "$ENV_FILE" logs --tail=100 web >&2
exit 1
