# DevToolbox

一个面向日常开发、运维和学习场景的快速、注重隐私的开发者工具箱，覆盖格式化、编码、转换、测试、文件、Web 和参考资料等任务。DevToolbox 使用 Next.js、React 和 TypeScript 构建，提供简体中文和英文界面。

[English README](../README.md) · [开发进度与 Sprint 记录](../devlopment.md) · [CI 工作流](../.github/workflows/ci.yml)

> DevToolbox 仍在持续开发中。当前仓库包含已经实现的应用和部署路径，但实际公共域名、HTTPS 证书上线和持续部署（CD）尚未完成。

## 项目概览

- **75 个已注册工具**，分为 **8 个分类**。
- 支持 `/zh` 和 `/en` 本地化路由；中文（`zh`）是配置的默认语言。
- 许多核心格式化、编码、转换、文件、图片、归档、密码学和参考工具在浏览器中运行。
- 收藏和最近使用工具保存在当前浏览器中；默认不会持久化工具输入内容。
- 支持双语全局搜索、响应式布局、浅色/深色/跟随系统主题、分享操作和独立工具页面。
- 工具按需动态加载，并使用统一的输入、输出、执行、取消和错误恢复机制。
- 提供可选的用户账户，以及独立授权的管理后台。
- 支持 Docker Compose 和 Node.js 原生部署。

注册工具数量和分类模型由 [`src/lib/tool-registry.ts`](../src/lib/tool-registry.ts) 维护，并由 registry 测试覆盖。完整的中文 Sprint 清单见 [`devlopment.md`](../devlopment.md)。

## 为什么选择 DevToolbox？

开发者工具应该打开即用、容易理解，并且能够谨慎处理敏感文本。DevToolbox 尽量让常见转换在用户侧完成：许多工具直接在浏览器中运行，较重的操作可以放在 Web Worker 中执行，以减少对界面交互的影响。

隐私模型有明确边界：

- 核心工具输入默认不会被持久化。
- 收藏和最近使用只把工具标识符保存在浏览器 `localStorage` 中，不保存工具输入；最近使用工具最多保留 8 项。
- API Request Builder 和 Webhook Tester 从浏览器直接向目标地址发送请求。它们不是通用服务器代理，仍然受目标服务 CORS 策略影响。
- 账户、管理后台、指标统计等服务端功能必然会与 DevToolbox 服务器通信。
- cURL 和请求代码生成器只生成源代码，不会执行生成的请求。

使用具体工具时，应以该工具页面展示的隐私说明为准，不要假设所有功能都采用完全相同的处理路径。

## 工具分类

当前 registry 将工具分为以下 8 个分类：

| 分类 | 能力范围 | 示例路由 |
| --- | --- | --- |
| **JSON 与数据** | 格式化、校验、压缩、查看和转换结构化数据；格式化 SQL；生成模拟数据 | `/zh/categories/json-data` |
| **编码与 URL** | 处理 Base64、文件、URL、Query String、Unicode、ASCII 和 UTF-8 | `/en/categories/encoding` |
| **文本工具** | 统计、转换大小写、清理、排序、编号、去重、合并、拆分和比较文本 | `/zh/categories/text` |
| **正则与测试** | 测试 JavaScript 正则表达式、替换、捕获组、模板和语法说明 | `/en/categories/regex` |
| **时间与数字** | 转换时间戳、进制和数据大小；解析 Cron 表达式；生成随机值 | `/zh/categories/time-number` |
| **Hash 与身份** | 生成 UUID、Hash、密码、随机字符串和 SSH Key；解码 JWT | `/en/categories/crypto` |
| **文件与图片** | 检查文件、转换图片，以及创建或解压 ZIP/TAR/GZIP 归档 | `/zh/categories/files` |
| **Web 开发** | 处理颜色、二维码、cURL、HTTP、API、Webhook、标记语言、Git、网络和速查表 | `/en/categories/web` |

上面的路径是路由示例，并不代表项目已经拥有对应的公共线上域名。单个工具位于 `/<locale>/tools/<slug>`，也可以从本地化工具目录进入。

代表性工具包括：

- JSON Formatter、Validator、Minifier、JSON 转 YAML/XML/CSV 和 JSON Tree Viewer。
- Base64、URL、Query String、Unicode、ASCII 和 UTF-8 工具。
- Text Counter、Case Converter、行处理、Text Diff 和 Regex Tester。
- Timestamp、Cron、进制、UUID、Hash、JWT、密码和随机数据生成器。
- Image Workbench、Archive Workbench、File Inspector 和 SSH Key Generator。
- Color Converter、QR Code Generator、cURL Parser/Generator、HTML/CSS/JavaScript 格式化工具、API Request Builder 和 Webhook Tester。
- Linux、Git、Docker、Nginx、Vim、Regex、Bash、SQL、JavaScript、Python、HTTP 和 CSS 可搜索速查表。

## 用户功能

- **双语导航：** 在 `zh` 和 `en` 之间切换，并在存在对应本地化页面时保留当前路由。
- **全局搜索：** 同时搜索双语工具名称、别名、描述、关键词和分类元数据。可以从顶部导航打开，也可以使用 `Ctrl+K` / `Cmd+K`。
- **响应式界面：** 工具页面适配桌面和移动端，支持浅色、深色和跟随系统的主题偏好。
- **本地工具列表：** 收藏和最近使用工具保存在当前浏览器中。登录不会把工具输入变成服务器同步的文档。
- **工具页面：** 每个工具拥有本地化 URL、元数据、面包屑、相关推荐、FAQ、隐私说明，以及适用时的复制、下载、导出和分享操作。
- **可靠加载：** 工具实现按需加载，并提供加载状态、取消支持和可恢复的错误状态。

## 架构

```text
本地化路由
    │
    ├── 本地化消息和工具元数据
    │
    └── 工具 registry
          │
          └── 根据 slug 动态映射组件
                │
                ├── 浏览器本地工具逻辑
                ├── 在适用场景中使用 Web Worker 执行
                └── 复制 / 下载 / 分享 / 收藏 / 最近使用操作
```

主要扩展点如下：

- [`src/lib/tool-registry.ts`](../src/lib/tool-registry.ts) 定义分类、工具定义、限制、SEO 元数据、FAQ、相关推荐和搜索数据。
- [`src/components/tools/registered-tool.tsx`](../src/components/tools/registered-tool.tsx) 将 slug 映射到动态导入的组件，并提供加载状态和错误边界。
- [`src/lib/config.ts`](../src/lib/config.ts) 集中定义输入、输出、文件、归档、执行、JSON、正则和并发限制。
- [`src/i18n/config.ts`](../src/i18n/config.ts) 定义支持的语言、默认语言行为和本地化路由工具；中文工具元数据位于 [`src/i18n/tool-metadata/zh.ts`](../src/i18n/tool-metadata/zh.ts)。
- [`src/lib/browser-storage.ts`](../src/lib/browser-storage.ts) 管理浏览器本地的收藏和最近使用工具标识符。
- [`next.config.ts`](../next.config.ts) 启用 standalone 输出并配置安全相关响应头。

Registry 元数据会驱动工具目录、分类页、搜索、静态工具路由、本地化 SEO 元数据、Sitemap、FAQ 和相关推荐。多个 slug 可以共享组件实现，但每个工具仍然拥有独立可访问的地址。

## 账户与管理后台

管理后台有意不出现在公共导航中。授权操作人员可以直接打开 `/<locale>/admin`。后台与普通用户会话使用独立的认证边界，敏感操作会在服务端重新进行权限校验。

根据权限和配置，后台提供：

- DAU/WAU/MAU、注册用户和活跃用户数量、访问量、页面浏览量、独立访客、工具使用、API、文件和错误指标。
- 可搜索、分页的用户管理，包括查看账户、禁用账户、重置密码、角色变更和删除流程。
- 工具元数据和可用性配置，包括本地化内容及运行限制。
- 站点设置、注册和邮箱验证开关、维护模式，以及记录管理员变更的审计日志。

当数据库为空时，首次启动的进程可以使用 `ADMIN_USERNAME`、`ADMIN_NAME` 和 `ADMIN_PASSWORD` 创建一个 Super Admin。密码至少需要 12 个字符，并包含大写字母、小写字母、数字和符号。Bootstrap 配置不会覆盖已有 Super Admin。进行 schema 升级或恢复前，应备份 SQLite 数据库；如果存在，也要一并备份 `-wal` 和 `-shm` 文件。

## 本地开发

### 环境要求

- Node.js **22 或更高版本**。CI 工作流和 Docker 镜像使用 Node.js 24。
- npm。

### 启动开发服务器

```bash
npm install
npm run dev
```

打开 <http://localhost:8886>。根路由会根据 `devtoolbox-locale` Cookie 和浏览器的 `Accept-Language` 请求头选择语言，然后跳转到 `/zh` 或 `/en`。没有偏好时，配置的默认路径是 `/zh`。

### 可用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 在端口 `8886` 启动 Next.js 开发服务器 |
| `npm run lint` | 运行 ESLint，并要求零 warning |
| `npm run typecheck` | 运行 TypeScript 检查，不生成文件 |
| `npm test` | 执行一次 Vitest 单元和应用测试 |
| `npm run test:watch` | 以 watch 模式运行 Vitest |
| `npm run test:e2e` | 运行 Playwright 浏览器测试 |
| `npm run build` | 构建 Next.js standalone 应用 |
| `npm start` | 启动已经构建好的 standalone 生产应用 |
| `npm run check` | 运行 lint、typecheck、单元测试和 build |

`npm run check` 不包含 Playwright E2E。E2E 配置会构建隔离的测试部署，使用 Chromium 和 Pixel 7 项目，并管理临时测试数据。在新环境中，可以使用 `npx playwright install --with-deps chromium` 安装所需浏览器。

## 配置

可将 [`.env.example`](../.env.example) 复制为配置起点，用于 Docker 或本地部署。不要提交密钥。

| 变量 | 常见值 | 用途 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:8886` | 用于 metadata、Sitemap 和 robots 的规范来源；会在构建时嵌入 |
| `DATABASE_PATH` | `/data/devtoolbox.sqlite` | Compose 中可写的 SQLite 数据库路径 |
| `ADMIN_USERNAME` | `admin` | 空数据库首次启动时的 Super Admin 用户名 |
| `ADMIN_NAME` | `DevToolbox Admin` | 首个 Super Admin 的显示名称 |
| `ADMIN_PASSWORD` | 唯一强密码 | 首个 Super Admin 的密码；仅用于 bootstrap |
| `MAIL_TRANSPORT` | `smtp` 或开发环境 `outbox` | 账户邮件投递方式 |
| `MAIL_FROM` | 发件人地址 | SMTP 邮件使用的发件人 |
| `SMTP_HOST` | SMTP 主机名 | SMTP 服务器 |
| `SMTP_PORT` | `587` | SMTP 服务器端口 |
| `SMTP_SECURE` | `false` | 是否使用隐式 TLS |
| `SMTP_USER` | 可选 | SMTP 用户名 |
| `SMTP_PASSWORD` | 可选 | SMTP 密码 |
| `APP_PORT` | `8886` | Docker Compose 对外暴露的回环端口 |
| `IMAGE_NAME` | `web-dev-tools` | Docker 镜像名称 |
| `IMAGE_TAG` | `latest` | Docker 镜像标签 |

原生部署使用 `.env.native`，还可以设置 `PORT`、`BIND_HOST`、`DATA_DIR` 或 `NATIVE_DIR`；完整原生配置见 [`deploy/README.md`](../deploy/README.md)。生产环境的注册、邮箱验证和密码找回需要可用的 SMTP。开发环境可以使用权限受限的文件 outbox；生产环境会拒绝该传输方式，除非显式启用仅供 E2E 使用的覆盖配置。

## 部署

两种支持的部署路径默认都绑定到回环地址。若要公开访问，应在应用前放置 Nginx 或其他 TLS 反向代理。目前项目尚未包含已上线的公共域名、证书和 CD 流程。

### Docker Compose

```bash
cp .env.example .env
# 修改 NEXT_PUBLIC_SITE_URL、管理员和 SMTP 配置。
docker compose up -d --build
curl http://127.0.0.1:8886/api/health
```

Docker 镜像使用 Next.js standalone 输出和 Node 24 Alpine。运行时使用非 root 用户，将 SQLite 保存在持久化的 `/data` 数据卷中，根文件系统为只读，删除 Linux capabilities，启用 `no-new-privileges`，轮换 JSON 日志，并通过 `/api/health` 提供健康检查。

部署脚本、反向代理配置、升级、日志、停止和备份说明见 [`deploy/README.md`](../deploy/README.md)。Nginx 配置示例见 [`deploy/nginx.conf.example`](../deploy/nginx.conf.example)。

### Node.js 原生部署（不使用 Docker）

```bash
./scripts/install-no-docker.sh
```

安装器需要 Node.js 22+、npm 和 `curl` 或 `wget`。它会安装锁定版本依赖、构建 standalone 应用、将不可变运行时版本保存在 `.native/` 下、将应用数据保留在配置的数据目录中、启动服务、检查 `/api/health`，并在新进程无法启动时尝试恢复上一版本。它不会自动安装操作系统的开机服务。

```bash
./scripts/native-service.sh status
./scripts/native-service.sh logs
./scripts/native-service.sh restart
./scripts/native-service.sh stop
```

公开暴露原生安装前，请阅读 [`deploy/README.md`](../deploy/README.md)，其中包含 `.env.native` 示例、反向代理与 HTTPS 步骤、升级和回滚指南、服务操作及数据库备份说明。

## 安全边界与限制

应用使用多层限制，但这些控制不能替代对待处理内容和部署环境的审查。重要边界包括：

- 集中限制覆盖文本（1 MiB）、JSON（5 MiB）、正则输入（500 KiB）、Diff（2 MiB）、文件（10 MiB）、图片（20 MiB）、归档（50 MiB）、解压输出（100 MiB）、工具输出（10 MiB）、执行时间（10 秒）和并发操作数（2）。源代码见 [`src/lib/config.ts`](../src/lib/config.ts)。
- JSON 嵌套层级、正则模式/替换文本长度、匹配数量、cURL 条目、随机批量大小、生成输出，以及归档路径穿越、绝对路径、深度、条目数、解压大小和压缩比均受到限制。
- 正则工具使用 JavaScript `RegExp`，不是 PCRE，并限制输入、匹配数量、执行时间和明显的嵌套量词模式。
- JWT 解码只是读取 Token 内容，**不等于**验签，也不能建立信任。
- MD5 和 SHA-1 用于兼容性和识别场景，不应作为新的密码存储或安全设计方案。
- API Request Builder 和 Webhook Tester 由浏览器直接发出请求，并受目标服务的 CORS 和网络策略限制；服务器不是通用请求代理。
- HTML、CSS、JavaScript 和 SQL 工具处理的是源文本，不会执行提交的源代码。
- 响应头包含 CSP、禁止被框架嵌入、MIME sniffing 防护、严格来源 Referrer Policy 和受限浏览器权限。由于浏览器直连请求工具的需要，CSP 允许 HTTP 和 HTTPS 连接。
- 生产环境的账户验证和密码恢复依赖正确配置的 SMTP；会话和 Token 的安全使用仍需要合适的运维控制。

## 测试与 CI

仓库使用多层验证：

- Vitest 覆盖纯工具逻辑、限制、registry 行为和应用行为。
- Playwright E2E 覆盖本地化、响应式、工具、账户和管理后台流程，使用桌面 Chromium 和 Pixel 7 项目。
- GitHub Actions 使用 Node 24，通过 `npm ci` 执行 lint、typecheck、单元测试和生产构建，并在独立的 E2E job 中运行 Playwright。

提交 Pull Request 前，请运行与改动相关的检查。Sprint 状态文件记录了更广泛的验收历史；当本地工作区存在未提交改动或缺少 E2E 环境时，具体结果可能不同。

## 新增工具

1. 将纯逻辑和可复用逻辑放在 `src/lib/tools/`，并添加针对性的单元测试。
2. 根据场景覆盖正常、空值、无效值、边界、Unicode 和限制场景。
3. 在 `src/components/tools/` 创建专用客户端组件。
4. 在 `src/lib/tool-registry.ts` 注册英文工具定义。
5. 在 `src/i18n/tool-metadata/zh.ts` 添加完整中文元数据。
6. 如果界面需要新文案，在两个语言字典中都添加共享 message key。
7. 在 `src/components/tools/registered-tool.tsx` 添加 slug 到组件的映射。
8. 有意识地定义限制、处理模式、SEO 元数据、FAQ 和相关推荐。
9. 为用户可见行为新增或更新 Playwright 覆盖。
10. 运行相关的 lint、typecheck、单元测试、build 和 E2E 检查。

Registry 元数据会自动驱动搜索、卡片、分类页、静态工具路由、本地化 SEO 元数据、Sitemap、FAQ 和相关推荐。应保持工具逻辑与界面分离；除非功能明确需要网络请求，否则不要上传用户输入。

## 项目状态与路线图

### 已完成

- 75 个工具组成的核心工具平台，覆盖 8 个分类。
- 简体中文和英文本地化、本地化元数据、SEO 路由、Sitemap、FAQ 和相关推荐。
- 浏览器本地处理、适用场景中的 Web Worker、统一限制、取消和错误恢复。
- 收藏、最近使用、账户流程、邮箱验证与找回密码支持，以及独立授权的管理后台。
- SQL、Web 代码、cURL、颜色、二维码、文件、图片、归档、生成器、网络、API、Webhook 和可搜索速查表工具系列。
- Docker Compose 部署，以及带健康检查的 Node.js 原生安装。
- Sprint 21 的颜色和二维码导入/导出、可访问性、跨语言分享/收藏/最近使用状态，以及统一工具状态处理改进。

### 计划中

下一阶段包括性能预算和 bundle 分析、可访问性审计、原生部署文档验证、升级/回滚/备份强化、CI/CD，以及公共域名和 HTTPS 上线。Pro、API、广告或商业功能目前只是探索性想法，并非已承诺的行为。

详细的带日期清单见 [`devlopment.md`](../devlopment.md)。

## 贡献方式

欢迎提交 Issue 和 Pull Request。提出改动时请：

- 说明用户问题，并保持改动范围聚焦。
- 保留两个支持的语言环境，为用户可见元数据补充翻译。
- 转换类功能优先使用浏览器本地处理，并清楚说明所有网络行为。
- 将安全敏感的校验放在服务端；如果需要调整统一限制，请解释取舍。
- 随实现一起添加测试；当命令、路由、限制或部署行为发生变化时同步更新文档。
- 对响应式、本地化和无障碍相关的界面改动，附上手工验证步骤。

## 许可证

Apache-2.0。详见 [`LICENSE`](../LICENSE)。
