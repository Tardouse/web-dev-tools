# Production deployment

## Native Node.js installation (without Docker)

Requirements: Node.js 22+, npm, and either `curl` or `wget`.

```bash
./scripts/install-native.sh
```

The installer performs an in-place production deployment without root access:

1. Creates `.env.native` on first run with mode `0600` and a random strong Super Admin password.
2. Installs the locked dependencies with `npm ci` and builds the Next.js standalone output.
3. Copies the immutable runtime into `.native/releases/<release-id>` while keeping SQLite under `data/`.
4. Gracefully stops the previous native process, switches the active release, and checks `/api/health`.
5. Restores the previous release when the new process cannot start successfully.

Edit `.env.native` to configure the native deployment:

```dotenv
NEXT_PUBLIC_SITE_URL="https://tools.example.com"
DATABASE_PATH="/absolute/path/to/web-dev-tools/data/devtoolbox.sqlite"
ADMIN_USERNAME="admin"
ADMIN_NAME="DevToolbox Admin"
ADMIN_PASSWORD="a-unique-strong-password"
PORT=8886
BIND_HOST="127.0.0.1"
```

`NEXT_PUBLIC_SITE_URL` is embedded during `next build`, so rerun the installer after changing it. Use an absolute `DATABASE_PATH`; the installer rejects relative database paths so data cannot accidentally move between release directories.

Native operations:

```bash
./scripts/native-service.sh status
./scripts/native-service.sh logs
./scripts/native-service.sh restart
./scripts/native-service.sh stop
```

The built-in process manager survives terminal disconnects but does not install a boot-time operating-system service. After a host reboot, run `./scripts/native-service.sh start`, or configure your preferred system service manager to invoke that command.

To customize paths or the initial port on first installation:

```bash
NATIVE_PORT=9000 DATA_DIR=/srv/devtoolbox/data ./scripts/install-native.sh
ENV_FILE=/etc/devtoolbox.env NATIVE_DIR=/opt/devtoolbox-runtime ./scripts/install-native.sh
```

## Docker installation

```bash
cp .env.example .env
# Set NEXT_PUBLIC_SITE_URL, APP_PORT, ADMIN_USERNAME, and a strong ADMIN_PASSWORD in .env
./scripts/deploy.sh
```

The script checks Docker, creates `.env` when absent, builds the image, starts Compose, waits for `/api/health`, and prints service status. Re-running it updates the current deployment safely. Public pages are available under `/zh` and `/en`; `/` redirects according to the saved or browser-preferred language.

## Reverse proxy and HTTPS

Both the native server and Compose service bind to `127.0.0.1` by default so they are not directly public. Put Nginx or another TLS proxy in front of the selected deployment.

1. Copy `nginx.conf.example` into `/etc/nginx/sites-available/devtoolbox`.
2. Replace `tools.example.com` and ensure DNS resolves to the host.
3. Obtain a certificate, for example with `sudo certbot --nginx -d tools.example.com`.
4. Validate and reload: `sudo nginx -t && sudo systemctl reload nginx`.
5. Set `NEXT_PUBLIC_SITE_URL=https://tools.example.com` in `.env.native` and rerun `./scripts/install-native.sh`, or set it in `.env` and rerun `./scripts/deploy.sh` for Docker. This ensures canonical metadata is built correctly.

## Docker operations

```bash
docker compose ps
docker compose logs -f --tail=100 web
./scripts/stop.sh
```

The container runs as an unprivileged user, drops Linux capabilities, uses a read-only root filesystem (with only the `/data` volume writable), rotates JSON logs, and exposes a Docker health check.

## Administration and database operations

On the first start of an empty database, `ADMIN_USERNAME`, `ADMIN_NAME`, and `ADMIN_PASSWORD` create the sole Super Admin. The password must contain at least 12 characters with upper/lowercase letters, a number, and a symbol. These variables never overwrite an existing administrator. Open `/<locale>/admin` and sign in; all admin mutations are permission checked and written to the audit log.

SQLite is persisted in the `devtoolbox-data` volume at `/data/devtoolbox.sqlite`. Back up consistently before deploying schema changes:

```bash
docker compose stop web
docker run --rm -v devtoolbox_devtoolbox-data:/data -v "$PWD":/backup alpine \
  cp /data/devtoolbox.sqlite /backup/devtoolbox-$(date +%F).sqlite
docker compose start web
```

Restore only while the web service is stopped, retain ownership for UID/GID 1001, and keep backup files out of the public web root.

For a native deployment, stop the process and copy the configured SQLite database together with its `-wal` and `-shm` files when present:

```bash
./scripts/native-service.sh stop
cp -a data/devtoolbox.sqlite* /path/to/backup/
./scripts/native-service.sh start
```
