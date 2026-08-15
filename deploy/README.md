# Production deployment

## One command

```bash
cp .env.example .env
# Set NEXT_PUBLIC_SITE_URL, APP_PORT, ADMIN_USERNAME, and a strong ADMIN_PASSWORD in .env
./scripts/deploy.sh
```

The script checks Docker, creates `.env` when absent, builds the image, starts Compose, waits for `/api/health`, and prints service status. Re-running it updates the current deployment safely. Public pages are available under `/zh` and `/en`; `/` redirects according to the saved or browser-preferred language.

## Reverse proxy and HTTPS

The Compose service binds to `127.0.0.1` by default so it is not directly public. Put Nginx or another TLS proxy in front of it.

1. Copy `nginx.conf.example` into `/etc/nginx/sites-available/devtoolbox`.
2. Replace `tools.example.com` and ensure DNS resolves to the host.
3. Obtain a certificate, for example with `sudo certbot --nginx -d tools.example.com`.
4. Validate and reload: `sudo nginx -t && sudo systemctl reload nginx`.
5. Set `NEXT_PUBLIC_SITE_URL=https://tools.example.com` in `.env` and rerun `./scripts/deploy.sh` so canonical metadata is built correctly.

## Operations

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
