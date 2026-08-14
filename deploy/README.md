# Production deployment

## One command

```bash
cp .env.example .env
# Set NEXT_PUBLIC_SITE_URL and APP_PORT in .env
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

The container runs as an unprivileged user, drops Linux capabilities, uses a read-only root filesystem, rotates JSON logs, and exposes a Docker health check.
