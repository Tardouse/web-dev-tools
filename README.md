# DevToolbox

A fast, privacy-oriented developer toolbox for everyday formatting, encoding, conversion, testing, file, web, and reference tasks. DevToolbox is built with Next.js, React, and TypeScript and provides Simplified Chinese and English interfaces.

[中文文档](docs/README.zh-CN.md) · [Development status and sprint record](devlopment.md) · [CI workflow](.github/workflows/ci.yml)

> DevToolbox is an actively developed project. The current repository contains the implemented application and deployment paths, but a public domain, HTTPS certificate rollout, and continuous deployment have not yet been completed.

## At a glance

- **75 registered tools** across **8 categories**.
- Localized routes under `/zh` and `/en`; Chinese (`zh`) is the configured default locale.
- Many core formatting, encoding, conversion, file, image, archive, cryptographic, and reference operations run in the browser.
- Browser-local favorites and recent-tool lists; tool input is not persisted by default.
- Bilingual global search, responsive layouts, light/dark/system themes, share actions, and independently addressable tool pages.
- Dynamic, on-demand tool loading with centralized limits, cancellation, and error recovery.
- Optional user accounts and a separately authorized administration console.
- Docker Compose and native Node.js deployment paths.

The registered-tool count and category model are maintained in [`src/lib/tool-registry.ts`](src/lib/tool-registry.ts) and covered by registry tests. The detailed Chinese sprint checklist is available in [`devlopment.md`](devlopment.md).

## Why DevToolbox?

Developer utilities are most useful when they are quick to open, easy to understand, and safe to use with sensitive text. DevToolbox keeps the common transformation path close to the user: many tools execute in the browser, and potentially expensive operations can run in a Web Worker so the interface remains responsive.

The privacy model has important boundaries:

- Core tool inputs are not persisted by default.
- Favorites and recents store tool identifiers in browser `localStorage`; they do not store tool input. Recent tools are capped at eight entries.
- API Request Builder and Webhook Tester send requests directly from the browser to the selected destination. They are not a general-purpose server proxy and remain subject to destination CORS policy.
- Account, administration, metrics, and other server-backed features necessarily communicate with the DevToolbox server.
- cURL and request-code generators produce source code; they do not execute the generated request.

Use the privacy statement for the specific tool you are using rather than assuming that every feature has the same processing path.

## Tool catalog

The registry currently groups tools into these eight categories:

| Category | What you can do | Example route |
| --- | --- | --- |
| **JSON & Data** | Format, validate, minify, inspect, and convert structured data; format SQL; generate mock data | `/zh/categories/json-data` |
| **Encoding & URLs** | Work with Base64, files, URLs, query strings, Unicode, ASCII, and UTF-8 | `/en/categories/encoding` |
| **Text Utilities** | Count, case-convert, clean, sort, number, deduplicate, merge, split, and compare text | `/zh/categories/text` |
| **Regex & Testing** | Test JavaScript regular expressions, replacements, captures, templates, and explanations | `/en/categories/regex` |
| **Time & Numbers** | Convert timestamps, bases, and data sizes; inspect cron expressions; generate values | `/zh/categories/time-number` |
| **Hash & Identity** | Generate UUIDs, hashes, passwords, random strings, and SSH keys; decode JWTs | `/en/categories/crypto` |
| **Files & Images** | Inspect files, transform images, and create or extract ZIP/TAR/GZIP archives | `/zh/categories/files` |
| **Web Development** | Work with colors, QR codes, cURL, HTTP, APIs, webhooks, markup, Git, networks, and cheatsheets | `/en/categories/web` |

The paths above are route examples, not links to a claimed public deployment. Individual tools are available under `/<locale>/tools/<slug>` and through the localized tool directory.

Representative tools include:

- JSON Formatter, Validator, Minifier, JSON-to-YAML/XML/CSV converters, and JSON Tree Viewer.
- Base64, URL, query-string, Unicode, ASCII, and UTF-8 utilities.
- Text Counter, Case Converter, line processing, Text Diff, and Regex Tester.
- Timestamp, cron, number-base, UUID, hash, JWT, password, and random-data generators.
- Image Workbench, Archive Workbench, File Inspector, and SSH Key Generator.
- Color Converter, QR Code Generator, cURL Parser/Generator, HTML/CSS/JavaScript formatters, API Request Builder, and Webhook Tester.
- Searchable Linux, Git, Docker, Nginx, Vim, Regex, Bash, SQL, JavaScript, Python, HTTP, and CSS cheatsheets.

## User experience

- **Bilingual navigation:** switch between `zh` and `en` while preserving the current route where a localized equivalent exists.
- **Global search:** search tool names, aliases, descriptions, keywords, and category metadata in both languages. Open search from the header or with `Ctrl+K` / `Cmd+K`.
- **Responsive interface:** tool pages adapt to desktop and mobile layouts and support light, dark, and system theme preferences.
- **Local tool lists:** favorite tools and recently opened tools are stored in the current browser. Signing in does not turn tool input into a server-synchronized document.
- **Tool pages:** each page has a localized URL, metadata, breadcrumbs, related tools, FAQs, privacy guidance, and supported actions such as copy, download, export, or share where applicable.
- **Resilient loading:** tool implementations are loaded on demand, with loading states, cancellation support, and recoverable error states.

## Architecture

```text
Localized route
    │
    ├── localized messages and tool metadata
    │
    └── tool registry
          │
          └── dynamic slug-to-component mapping
                │
                ├── browser-local tool logic
                ├── Web Worker execution where appropriate
                └── copy / download / share / favorite / recent actions
```

The main extension points are:

- [`src/lib/tool-registry.ts`](src/lib/tool-registry.ts) defines categories, tool definitions, limits, SEO metadata, FAQs, related tools, and registry-driven search data.
- [`src/components/tools/registered-tool.tsx`](src/components/tools/registered-tool.tsx) maps slugs to dynamically imported components and provides loading and error-boundary behavior.
- [`src/lib/config.ts`](src/lib/config.ts) centralizes input, output, file, archive, execution, JSON, regex, and concurrency limits.
- [`src/i18n/config.ts`](src/i18n/config.ts) defines supported locales, default-locale behavior, and locale route helpers. Chinese tool metadata lives in [`src/i18n/tool-metadata/zh.ts`](src/i18n/tool-metadata/zh.ts).
- [`src/lib/browser-storage.ts`](src/lib/browser-storage.ts) manages browser-local favorite and recent-tool identifiers.
- [`next.config.ts`](next.config.ts) enables standalone output and configures security-related response headers.

The registry feeds the tool directory, category pages, search, static tool routes, localized metadata, sitemap entries, FAQs, and related-tool navigation. Shared component implementations can still serve multiple registered slugs while each tool remains independently addressable.

## Administration and accounts

The administration console is intentionally absent from public navigation. Authorized operators open `/<locale>/admin` directly. It uses a separate admin authentication boundary from ordinary user sessions and re-authorizes sensitive operations on the server.

Depending on permissions and configuration, the console provides:

- DAU/WAU/MAU, registered and active-user counts, visits, page views, unique visitors, tool usage, API, file, and error metrics.
- Searchable and paginated user management, account inspection, disabling, password reset, role changes, and deletion workflows.
- Tool metadata and availability configuration, including localized content and operational limits.
- Site settings, registration and email-verification switches, maintenance mode, and audit logs for administrative mutations.

On an empty database, the first process can create one Super Admin from `ADMIN_USERNAME`, `ADMIN_NAME`, and `ADMIN_PASSWORD`. The password must be at least 12 characters and include uppercase and lowercase letters, a number, and a symbol. Bootstrap values do not overwrite an existing Super Admin. Back up the SQLite database, including `-wal` and `-shm` files when present, before schema upgrades or restore operations.

## Local development

### Requirements

- Node.js **22 or newer**. Node.js 24 is used by the CI workflow and Docker image.
- npm.

### Start the development server

```bash
npm install
npm run dev
```

Open <http://localhost:8886>. The root route chooses a locale from the `devtoolbox-locale` cookie and the browser's `Accept-Language` header, then redirects to `/zh` or `/en`. When no preference is available, the configured default is `/zh`.

### Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server on port `8886` |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Run TypeScript checking without emitting files |
| `npm test` | Run Vitest unit and application tests once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run build` | Build the Next.js standalone application |
| `npm start` | Start the existing standalone production build |
| `npm run check` | Run lint, typecheck, unit tests, and build |

`npm run check` does not include Playwright E2E tests. The E2E configuration builds an isolated test deployment, uses Chromium and Pixel 7 projects, and manages temporary test data. In a new environment, install the required browser with `npx playwright install --with-deps chromium`.

## Configuration

Copy [`.env.example`](.env.example) as a starting point for a Docker or local deployment. Do not commit secrets.

| Variable | Typical value | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:8886` | Canonical origin for metadata, sitemap, and robots; embedded during build |
| `DATABASE_PATH` | `/data/devtoolbox.sqlite` | Writable SQLite database path in Compose |
| `ADMIN_USERNAME` | `admin` | Initial Super Admin username on an empty database |
| `ADMIN_NAME` | `DevToolbox Admin` | Initial Super Admin display name |
| `ADMIN_PASSWORD` | strong unique value | Initial Super Admin password; used only for bootstrap |
| `MAIL_TRANSPORT` | `smtp` or development `outbox` | Account-email delivery mode |
| `MAIL_FROM` | sender address | Sender used by SMTP email |
| `SMTP_HOST` | SMTP hostname | SMTP server |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_SECURE` | `false` | Whether to use implicit TLS |
| `SMTP_USER` | optional | SMTP username when required |
| `SMTP_PASSWORD` | optional | SMTP password when required |
| `APP_PORT` | `8886` | Loopback host port exposed by Docker Compose |
| `IMAGE_NAME` | `web-dev-tools` | Docker image name |
| `IMAGE_TAG` | `latest` | Docker image tag |

Native deployments use `.env.native` and may also set `PORT`, `BIND_HOST`, `DATA_DIR`, or `NATIVE_DIR`; see [`deploy/README.md`](deploy/README.md) for the complete native configuration. Production registration, verification, and password recovery require working SMTP. Local development can use the permission-restricted file outbox; production rejects that transport unless an explicit E2E-only override is enabled.

## Deployment

Both supported deployment paths bind to loopback by default. For public exposure, put Nginx or another TLS reverse proxy in front of the application. A public domain, certificate, and CD pipeline are not included yet.

### Docker Compose

```bash
cp .env.example .env
# Edit NEXT_PUBLIC_SITE_URL, administrator, and SMTP settings.
docker compose up -d --build
curl http://127.0.0.1:8886/api/health
```

The Docker image uses Next.js standalone output and Node 24 Alpine. The runtime runs as a non-root user, keeps SQLite in a persistent `/data` volume, uses a read-only root filesystem, drops Linux capabilities, enables `no-new-privileges`, rotates JSON logs, and exposes a health check at `/api/health`.

For the deployment script, reverse proxy configuration, upgrades, logs, shutdown, and backups, see [`deploy/README.md`](deploy/README.md). The example Nginx configuration is [`deploy/nginx.conf.example`](deploy/nginx.conf.example).

### Native Node.js (without Docker)

```bash
./scripts/install-no-docker.sh
```

The installer requires Node.js 22+, npm, and `curl` or `wget`. It installs locked dependencies, builds the standalone application, stores immutable releases under `.native/`, keeps application data under the configured data directory, starts the service, checks `/api/health`, and can restore the previous release if the new process fails to start. It does not install a boot-time operating-system service automatically.

```bash
./scripts/native-service.sh status
./scripts/native-service.sh logs
./scripts/native-service.sh restart
./scripts/native-service.sh stop
```

Read [`deploy/README.md`](deploy/README.md) before exposing a native installation publicly. It contains `.env.native` examples, reverse proxy and HTTPS steps, upgrade and rollback guidance, service operations, and database backup instructions.

## Security boundaries and limits

The application applies defense-in-depth limits, but these controls are not a substitute for reviewing the content you process or the deployment around it. Important boundaries include:

- Central limits cover text (1 MiB), JSON (5 MiB), regex input (500 KiB), diffs (2 MiB), files (10 MiB), images (20 MiB), archives (50 MiB), extracted archive output (100 MiB), tool output (10 MiB), execution time (10 seconds), and two concurrent operations. See [`src/lib/config.ts`](src/lib/config.ts) for the source of truth.
- JSON nesting, regex pattern/replacement length, match count, cURL entries, random batches, generated output, archive traversal, absolute paths, depth, entry count, extraction size, and compression ratio are bounded.
- Regex execution uses JavaScript `RegExp`, not PCRE, and applies input, match, timeout, and obvious nested-quantifier safeguards.
- JWT decoding reads token contents; it does **not** verify signatures or establish trust.
- MD5 and SHA-1 are available for compatibility and identification workflows, not as recommendations for new password storage or security designs.
- API Request Builder and Webhook Tester make browser-direct requests and are limited by the target's CORS and network policy. The server is not a general-purpose request proxy.
- HTML, CSS, JavaScript, and SQL tools process source text; they do not execute the submitted source.
- Response headers include CSP, frame denial, MIME-sniffing protection, a strict-origin referrer policy, and restricted browser permissions. The CSP permits HTTP and HTTPS connections for browser-direct request tools.
- Account verification and password recovery depend on correctly configured SMTP in production. Session and token handling still needs to be deployed with appropriate operational controls.

## Testing and CI

The repository uses several validation layers:

- Vitest tests cover pure tool logic, limits, registry behavior, and application behavior.
- Playwright E2E tests exercise localized, responsive, tool, account, and administration workflows across desktop Chromium and Pixel 7 projects.
- GitHub Actions runs on Node 24 with `npm ci`, lint, typecheck, unit tests, and a production build in one validation job, followed by a separate Playwright E2E job.

Run the checks relevant to your change before opening a pull request. The sprint status file records the broader acceptance history; the exact result for a local checkout can differ when there are uncommitted changes or environment-specific E2E requirements.

## Adding a tool

1. Put pure, reusable logic under `src/lib/tools/` and add focused unit tests.
2. Cover normal, empty, invalid, boundary, Unicode, and limit cases where they apply.
3. Create a focused client component under `src/components/tools/`.
4. Register the English definition in `src/lib/tool-registry.ts`.
5. Add the complete Chinese metadata in `src/i18n/tool-metadata/zh.ts`.
6. Add shared message keys to both locale dictionaries when the UI needs them.
7. Add the slug-to-component mapping in `src/components/tools/registered-tool.tsx`.
8. Define limits, processing mode, SEO metadata, FAQs, and related tools deliberately.
9. Add or update Playwright coverage for user-visible behavior.
10. Run the relevant lint, typecheck, unit, build, and E2E checks.

Registry metadata automatically feeds search, cards, category pages, static tool routes, localized SEO metadata, sitemap entries, FAQs, and related-tool navigation. Keep tool logic separate from presentation and avoid uploading user input unless a feature explicitly requires a network request.

## Project status and roadmap

### Completed

- Core tool platform with 75 registered tools across eight categories.
- Simplified Chinese and English localization, localized metadata, SEO routes, sitemap, FAQs, and related-tool navigation.
- Browser-local processing, Web Worker execution where useful, centralized limits, cancellation, and error recovery.
- Favorites, recent tools, account flows, email verification and recovery support, and a separately authorized administration console.
- SQL, web-code, cURL, color, QR, file, image, archive, generator, network, API, webhook, and searchable cheatsheet tool families.
- Docker Compose deployment and native Node.js installation with health validation.
- Sprint 21 improvements for color and QR import/export, accessibility, cross-language share/favorite/recent state, and unified tool status handling.

### Planned

The next work includes performance budgets and bundle analysis, accessibility auditing, validation of native deployment documentation, upgrade/rollback/backup hardening, CI/CD, and public domain and HTTPS rollout. Pro, API, advertising, or commercial features are exploratory ideas rather than committed behavior.

For the detailed dated checklist, see [`devlopment.md`](devlopment.md).

## Contributing

Issues and pull requests are welcome. When proposing a change:

- Explain the user problem and keep the scope focused.
- Preserve both supported locales and add translations for user-facing metadata.
- Prefer browser-local processing for transformations and document any network behavior clearly.
- Keep security-sensitive validation on the server and do not weaken centralized limits without explaining the trade-off.
- Add tests with the implementation and update documentation when commands, routes, limits, or deployment behavior change.
- Include manual verification steps for responsive, localized, and accessibility-sensitive UI changes.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
