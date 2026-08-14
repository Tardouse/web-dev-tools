# DevToolbox

A fast, privacy-first, bilingual developer toolbox built with Next.js and TypeScript. It includes a metadata-driven platform, 21 browser-local tools, Simplified Chinese and English interfaces, global bilingual search, responsive light/dark themes, favorites, recent tools, localized SEO pages, and a secure administration console with real operational metrics and complete user management.

## Included tools

- JSON Formatter, Validator, and Minifier
- Base64 Encoder/Decoder, URL Encoder, URL Decoder
- Timestamp Converter, Cron Expression Tool, Number Base Converter
- UUID and Hash Generators, JWT Decoder
- Text Counter, Case Converter, Text Diff, Regex Tester
- Color Converter, QR Code Generator
- cURL Parser and Generator
- HTML Formatter

Core inputs are processed in the browser and are not sent to the server. Favorites and recents save only tool identifiers in local storage.

## Local development

Requirements: Node.js 22+ (Node.js 24 recommended) and npm.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The root detects the saved preference and browser language, then redirects to `/zh` or `/en`. The language switch preserves the current page. Useful checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Add a tool

1. Put pure tool logic under `src/lib/tools/` and add unit tests.
2. Create a focused client component under `src/components/tools/`.
3. Register English metadata, limits, SEO, related tools, and FAQs in `src/lib/tool-registry.ts`.
4. Add complete Chinese metadata in `src/i18n/tool-metadata/zh.ts` and any shared labels in both message dictionaries.
5. Add a dynamic component mapping in `src/components/tools/registered-tool.tsx`.

The registry automatically feeds search, cards, categories, static routes, sitemap entries, metadata, FAQs, and related-tool navigation. Dynamic mappings keep each tool implementation in a separate, on-demand bundle.

## Administration

The administration console is available at `/zh/admin` and `/en/admin`. It provides DAU/WAU/MAU, registered and active users, tool usage, PV/UV, visits, popular tools, error rate, API and file metrics, plus searchable/paginated user management. Admins can inspect users, disable accounts, reset passwords, change permitted roles, and delete accounts. Every admin mutation is re-authorized on the server, revokes affected sessions where appropriate, and writes an audit log.

For local development, set the bootstrap values before the first start:

```bash
DATABASE_PATH=./data/devtoolbox.sqlite
ADMIN_EMAIL=admin@example.com
ADMIN_NAME="DevToolbox Admin"
ADMIN_PASSWORD="a-unique-strong-password"
```

The first process that opens an empty database with both bootstrap variables configured creates one Super Admin. The password must be at least 12 characters and contain uppercase and lowercase letters, a number, and a symbol. Without those variables, public tools still run but no admin can sign in. Bootstrap variables do not overwrite an existing Super Admin. Back up the SQLite database file before upgrades.

## Docker

```bash
cp .env.example .env
# Edit NEXT_PUBLIC_SITE_URL if deploying publicly.
docker compose up -d --build
curl http://127.0.0.1:3000/api/health
```

The production image uses Next.js standalone output, a non-root user, a read-only filesystem, dropped capabilities, log rotation, and a health check.

## One-click deployment

```bash
./scripts/deploy.sh
```

See [`deploy/README.md`](deploy/README.md) for HTTPS, Nginx, updates, logs, and shutdown instructions.

## Configuration

| Variable               | Default                 | Purpose                                            |
| ---------------------- | ----------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Canonical origin for metadata, sitemap, and robots |
| `APP_PORT`             | `3000`                  | Loopback host port exposed by Compose              |
| `DATABASE_PATH`         | `/data/devtoolbox.sqlite` | Writable SQLite path (persistent Compose volume)  |
| `ADMIN_EMAIL`           | required                | First Super Admin email                            |
| `ADMIN_NAME`            | `DevToolbox Admin`       | First Super Admin display name                     |
| `ADMIN_PASSWORD`        | required                | First Super Admin bootstrap password               |
| `IMAGE_NAME`           | `web-dev-tools`         | Docker image name                                  |
| `IMAGE_TAG`            | `latest`                | Docker image tag                                   |

Tool input limits are centralized in `src/lib/config.ts`.

## Security notes

- Core tool operations remain client-side.
- No tool input is persisted by default.
- CSP, frame denial, MIME sniffing protection, referrer policy, and restricted permissions headers are configured.
- Regex input, pattern length, match count, and obvious nested quantifiers are limited.
- JSON size and nesting depth are guarded.
- JWT decoding is explicitly separate from signature verification.
- MD5 and SHA-1 are marked compatibility-only.
- The current MVP exposes no proxy/request execution or file-upload endpoints, avoiding SSRF and upload attack surface.

## License

Apache-2.0. See [LICENSE](LICENSE).
