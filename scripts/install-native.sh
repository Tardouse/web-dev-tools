#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT_DIR"

absolute_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s\n' "$ROOT_DIR/$1" ;;
  esac
}

ENV_FILE=$(absolute_path "${ENV_FILE:-.env.native}")
NATIVE_DIR=$(absolute_path "${NATIVE_DIR:-.native}")
DATA_DIR=$(absolute_path "${DATA_DIR:-data}")
LOG_DIR=$(absolute_path "${LOG_DIR:-$NATIVE_DIR/logs}")
RELEASES_DIR="$NATIVE_DIR/releases"
CURRENT_LINK="$NATIVE_DIR/current"
SERVICE_SCRIPT="$ROOT_DIR/scripts/native-service.sh"
ENV_LOADER="$ROOT_DIR/scripts/native-env-loader.cjs"
NATIVE_PORT=${NATIVE_PORT:-8886}
BIND_HOST=${BIND_HOST:-127.0.0.1}
START_SERVICE=${START_SERVICE:-1}
SKIP_INSTALL=${SKIP_INSTALL:-0}
GENERATED_ADMIN_PASSWORD=""
STAGING_DIR=""

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

cleanup_staging() {
  case "$STAGING_DIR" in
    "$RELEASES_DIR"/.staging-*)
      [ ! -d "$STAGING_DIR" ] || rm -rf -- "$STAGING_DIR"
      ;;
  esac
}

env_value() {
  node --env-file="$ENV_FILE" -e \
    'process.stdout.write(process.env[process.argv[1]] ?? "")' "$1"
}

run_service() {
  ENV_FILE="$ENV_FILE" NATIVE_DIR="$NATIVE_DIR" LOG_DIR="$LOG_DIR" \
    "$SERVICE_SCRIPT" "$@"
}

trap cleanup_staging EXIT
trap 'exit 1' HUP INT TERM

command -v node >/dev/null 2>&1 || die "Node.js 22 or newer is required."
command -v npm >/dev/null 2>&1 || die "npm is required."
if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
  die "curl or wget is required for health checks."
fi
NODE_MAJOR=$(node -p 'Number(process.versions.node.split(".")[0])')
if [ "$NODE_MAJOR" -lt 22 ]; then
  die "Node.js 22 or newer is required; found $(node --version)."
fi

case "$NATIVE_PORT" in
  ''|*[!0-9]*) die "NATIVE_PORT must be numeric." ;;
esac
if [ "$NATIVE_PORT" -lt 1 ] || [ "$NATIVE_PORT" -gt 65535 ]; then
  die "NATIVE_PORT must be between 1 and 65535."
fi

mkdir -p "$NATIVE_DIR" "$RELEASES_DIR" "$DATA_DIR"
chmod 700 "$NATIVE_DIR" "$DATA_DIR"

if [ ! -f "$ENV_FILE" ]; then
  GENERATED_ADMIN_PASSWORD="Aa1!$(node -e 'process.stdout.write(require("node:crypto").randomBytes(18).toString("base64url"))')"
  umask 077
  {
    printf '%s\n' '# Native deployment settings. This file contains secrets.'
    printf 'NEXT_PUBLIC_SITE_URL="http://127.0.0.1:%s"\n' "$NATIVE_PORT"
    printf 'DATABASE_PATH="%s/devtoolbox.sqlite"\n' "$DATA_DIR"
    printf 'ADMIN_USERNAME="%s"\n' "${NATIVE_ADMIN_USERNAME:-admin}"
    printf 'ADMIN_NAME="%s"\n' "${NATIVE_ADMIN_NAME:-DevToolbox Admin}"
    printf 'ADMIN_PASSWORD="%s"\n' "$GENERATED_ADMIN_PASSWORD"
    printf '%s\n' '# Configure these values before using registration or password recovery.'
    printf '%s\n' 'MAIL_TRANSPORT="smtp"'
    printf '%s\n' 'MAIL_FROM="DevToolbox <no-reply@tools.example.com>"'
    printf '%s\n' 'SMTP_HOST="smtp.example.com"' 'SMTP_PORT=587' 'SMTP_SECURE=false'
    printf '%s\n' 'SMTP_USER="replace-with-smtp-user"' 'SMTP_PASSWORD="replace-with-smtp-password"'
    printf 'PORT=%s\n' "$NATIVE_PORT"
    printf 'BIND_HOST="%s"\n' "$BIND_HOST"
    printf '%s\n' 'NODE_ENV=production' 'NEXT_TELEMETRY_DISABLED=1'
  } >"$ENV_FILE"
  chmod 600 "$ENV_FILE"
  printf 'Created native configuration: %s\n' "$ENV_FILE"
else
  chmod 600 "$ENV_FILE"
  printf 'Using existing native configuration: %s\n' "$ENV_FILE"
fi

DATABASE_PATH_VALUE=$(env_value DATABASE_PATH)
case "$DATABASE_PATH_VALUE" in
  /*) ;;
  '') die "DATABASE_PATH is required in $ENV_FILE." ;;
  *) die "DATABASE_PATH must be absolute for native releases: $DATABASE_PATH_VALUE" ;;
esac

if [ "$SKIP_INSTALL" = "1" ]; then
  [ -d node_modules ] || die "SKIP_INSTALL=1 requires an existing node_modules directory."
  printf '%s\n' "Skipping npm ci because SKIP_INSTALL=1."
else
  printf '%s\n' "Installing locked Node.js dependencies directly on the host..."
  npm ci --no-audit --no-fund
fi

printf '%s\n' "Building the native Next.js standalone release..."
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 NATIVE_ENV_FILE="$ENV_FILE" \
  node --require "$ENV_LOADER" node_modules/next/dist/bin/next build

[ -f .next/standalone/server.js ] || die "Next.js did not produce .next/standalone/server.js."
RELEASE_ID="$(date -u +%Y%m%d%H%M%S)-$$"
STAGING_DIR="$RELEASES_DIR/.staging-$RELEASE_ID"
NEW_RELEASE="$RELEASES_DIR/$RELEASE_ID"
mkdir -p "$STAGING_DIR/.next/static" "$STAGING_DIR/public"
cp -R .next/standalone/. "$STAGING_DIR/"
cp -R .next/static/. "$STAGING_DIR/.next/static/"
cp -R public/. "$STAGING_DIR/public/"
cp "$ENV_LOADER" "$STAGING_DIR/native-env-loader.cjs"
# Next.js may copy project environment files into standalone output. Runtime
# configuration is loaded from ENV_FILE, so do not retain stale secret copies.
for RELEASE_ENV_FILE in "$STAGING_DIR"/.env "$STAGING_DIR"/.env.*; do
  [ ! -f "$RELEASE_ENV_FILE" ] || rm -f -- "$RELEASE_ENV_FILE"
done
mv "$STAGING_DIR" "$NEW_RELEASE"
STAGING_DIR=""

if [ -e "$CURRENT_LINK" ] && [ ! -L "$CURRENT_LINK" ]; then
  die "$CURRENT_LINK exists but is not a symlink; refusing to replace it."
fi
OLD_RELEASE=""
if [ -L "$CURRENT_LINK" ]; then
  OLD_RELEASE=$(readlink "$CURRENT_LINK")
fi

if [ "$START_SERVICE" = "0" ]; then
  ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
  printf 'Native release installed without starting: %s\n' "$NEW_RELEASE"
else
  run_service stop
  ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
  if ! run_service start; then
    printf '%s\n' "New release failed; attempting to restore the previous release." >&2
    run_service stop || true
    if [ -n "$OLD_RELEASE" ] && [ -f "$OLD_RELEASE/server.js" ]; then
      ln -sfn "$OLD_RELEASE" "$CURRENT_LINK"
      run_service start || true
    fi
    exit 1
  fi
fi

printf 'Native release installed: %s\n' "$NEW_RELEASE"
printf 'Database: %s\n' "$DATABASE_PATH_VALUE"
printf 'Operations: ENV_FILE=%s NATIVE_DIR=%s %s {status|logs|restart|stop}\n' \
  "$ENV_FILE" "$NATIVE_DIR" "$SERVICE_SCRIPT"
if [ -n "$GENERATED_ADMIN_PASSWORD" ]; then
  printf '\nInitial administrator: %s\n' "${NATIVE_ADMIN_USERNAME:-admin}"
  printf 'Initial password: %s\n' "$GENERATED_ADMIN_PASSWORD"
  printf '%s\n' "The password is stored in $ENV_FILE; protect this file and change the password after sign-in."
fi
