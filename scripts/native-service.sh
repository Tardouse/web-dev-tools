#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

absolute_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s\n' "$ROOT_DIR/$1" ;;
  esac
}

ENV_FILE=$(absolute_path "${ENV_FILE:-.env.native}")
NATIVE_DIR=$(absolute_path "${NATIVE_DIR:-.native}")
LOG_DIR=$(absolute_path "${LOG_DIR:-$NATIVE_DIR/logs}")
PID_FILE="$NATIVE_DIR/run/devtoolbox.pid"
CURRENT_LINK="$NATIVE_DIR/current"
LOG_FILE="$LOG_DIR/devtoolbox.log"
MAX_ATTEMPTS=${MAX_ATTEMPTS:-30}
STOP_TIMEOUT=${STOP_TIMEOUT:-30}

die() {
  printf 'Error: %s\n' "$1" >&2
  exit 1
}

env_value() {
  node --env-file="$ENV_FILE" -e \
    'process.stdout.write(process.env[process.argv[1]] ?? "")' "$1"
}

read_pid() {
  [ -f "$PID_FILE" ] || return 1
  pid=$(awk 'NR == 1 { print $1 }' "$PID_FILE")
  case "$pid" in
    ''|*[!0-9]*) return 1 ;;
  esac
  printf '%s\n' "$pid"
}

process_identity() {
  pid=$1
  value=""
  if [ -r "/proc/$pid/stat" ]; then
    value=$(sed 's/^.*) //' "/proc/$pid/stat" | awk '{ print $20 }')
  else
    value=$(ps -p "$pid" -o lstart= 2>/dev/null || true)
  fi
  [ -n "$value" ] || return 1
  printf '%s' "$value" | cksum | awk '{ print $1 ":" $2 }'
}

is_managed_process() {
  pid=$1
  kill -0 "$pid" 2>/dev/null || return 1
  expected=$(awk 'NR == 1 { print $2 }' "$PID_FILE")
  [ -n "$expected" ] || return 1
  actual=$(process_identity "$pid") || return 1
  [ "$actual" = "$expected" ]
}

running_pid() {
  pid=$(read_pid) || return 1
  is_managed_process "$pid" || return 1
  printf '%s\n' "$pid"
}

health_check() {
  response=""
  if command -v curl >/dev/null 2>&1; then
    response=$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null) || return 1
  elif command -v wget >/dev/null 2>&1; then
    response=$(wget -qO- -T 5 "$HEALTH_URL" 2>/dev/null) || return 1
  else
    die "curl or wget is required for health checks."
  fi
  case "$response" in
    *'"service":"web-dev-tools"'*) return 0 ;;
    *) return 1 ;;
  esac
}

load_runtime_config() {
  command -v node >/dev/null 2>&1 || die "Node.js is required."
  [ -f "$ENV_FILE" ] || die "Native environment file not found: $ENV_FILE"
  PORT_VALUE=$(env_value PORT)
  BIND_HOST_VALUE=$(env_value BIND_HOST)
  PORT_VALUE=${PORT_VALUE:-8886}
  BIND_HOST_VALUE=${BIND_HOST_VALUE:-127.0.0.1}
  case "$PORT_VALUE" in
    ''|*[!0-9]*) die "PORT must be a number in $ENV_FILE." ;;
  esac
  if [ "$PORT_VALUE" -lt 1 ] || [ "$PORT_VALUE" -gt 65535 ]; then
    die "PORT must be between 1 and 65535."
  fi
  HEALTH_URL=${HEALTH_URL:-"http://127.0.0.1:$PORT_VALUE/api/health"}
}

start_service() {
  load_runtime_config
  if pid=$(running_pid); then
    printf 'DevToolbox is already running (PID %s).\n' "$pid"
    return 0
  fi
  [ -L "$CURRENT_LINK" ] || die "No native release is installed. Run scripts/install-native.sh first."
  RELEASE_DIR=$(readlink "$CURRENT_LINK")
  [ -f "$RELEASE_DIR/server.js" ] || die "Native release is incomplete: $RELEASE_DIR"
  [ -f "$RELEASE_DIR/native-env-loader.cjs" ] || die "Native environment loader is missing: $RELEASE_DIR"

  mkdir -p "$NATIVE_DIR/run" "$LOG_DIR"
  rm -f "$PID_FILE"
  if ! (
    cd "$RELEASE_DIR"
    if command -v setsid >/dev/null 2>&1; then
      nohup setsid env \
        NODE_ENV=production \
        NEXT_TELEMETRY_DISABLED=1 \
        NATIVE_ENV_FILE="$ENV_FILE" \
        HOSTNAME="$BIND_HOST_VALUE" \
        PORT="$PORT_VALUE" \
        node --require "$RELEASE_DIR/native-env-loader.cjs" "$RELEASE_DIR/server.js" \
        </dev/null >>"$LOG_FILE" 2>&1 &
    else
      nohup env \
        NODE_ENV=production \
        NEXT_TELEMETRY_DISABLED=1 \
        NATIVE_ENV_FILE="$ENV_FILE" \
        HOSTNAME="$BIND_HOST_VALUE" \
        PORT="$PORT_VALUE" \
        node --require "$RELEASE_DIR/native-env-loader.cjs" "$RELEASE_DIR/server.js" \
        </dev/null >>"$LOG_FILE" 2>&1 &
    fi
    pid=$!
    identity=$(process_identity "$pid") || exit 1
    printf '%s %s\n' "$pid" "$identity" >"$PID_FILE"
  ); then
    die "The native server process could not be launched."
  fi

  pid=$(read_pid) || die "The native server did not create a PID."
  attempt=1
  while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
    if ! is_managed_process "$pid"; then
      printf '%s\n' "DevToolbox exited during startup. Recent logs:" >&2
      tail -n 100 "$LOG_FILE" >&2 || true
      rm -f "$PID_FILE"
      return 1
    fi
    if health_check; then
      printf 'DevToolbox is healthy at %s (PID %s).\n' "$HEALTH_URL" "$pid"
      return 0
    fi
    printf 'Waiting for native service (%s/%s)...\n' "$attempt" "$MAX_ATTEMPTS"
    sleep 2
    attempt=$((attempt + 1))
  done

  printf '%s\n' "DevToolbox failed its health check. Recent logs:" >&2
  tail -n 100 "$LOG_FILE" >&2 || true
  return 1
}

stop_service() {
  pid=$(read_pid) || {
    printf '%s\n' "DevToolbox is not running."
    rm -f "$PID_FILE"
    return 0
  }
  if ! is_managed_process "$pid"; then
    printf '%s\n' "Ignoring stale PID file; no matching native process is running."
    rm -f "$PID_FILE"
    return 0
  fi

  kill -TERM "$pid"
  elapsed=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$elapsed" -ge "$STOP_TIMEOUT" ]; then
      printf 'DevToolbox did not stop within %s seconds (PID %s).\n' "$STOP_TIMEOUT" "$pid" >&2
      return 1
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  rm -f "$PID_FILE"
  printf '%s\n' "DevToolbox stopped."
}

status_service() {
  load_runtime_config
  if pid=$(running_pid); then
    if health_check; then
      printf 'DevToolbox is running and healthy at %s (PID %s).\n' "$HEALTH_URL" "$pid"
      return 0
    fi
    printf 'DevToolbox is running but unhealthy (PID %s).\n' "$pid" >&2
    return 1
  fi
  printf '%s\n' "DevToolbox is not running."
  return 1
}

show_logs() {
  mkdir -p "$LOG_DIR"
  touch "$LOG_FILE"
  tail -n "${LOG_LINES:-100}" -f "$LOG_FILE"
}

case "${1:-status}" in
  start) start_service ;;
  stop) stop_service ;;
  restart)
    stop_service
    start_service
    ;;
  status) status_service ;;
  logs) show_logs ;;
  *) die "Usage: $0 {start|stop|restart|status|logs}" ;;
esac
