import type { ToolCategoryId } from "@/lib/types";

export interface LocalizedToolMetadata {
  name: string;
  shortName: string;
  description: string;
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  faq: Array<{ question: string; answer: string }>;
}

export const zhCategories: Record<
  ToolCategoryId,
  { name: string; description: string }
> = {
  "json-data": {
    name: "JSON 与数据",
    description: "格式化、校验和转换结构化数据",
  },
  encoding: { name: "编码与 URL", description: "编码和解码文本及 Web 数据" },
  text: { name: "文本工具", description: "统计、对比和转换文本" },
  regex: { name: "正则与测试", description: "测试表达式并查看匹配结果" },
  "time-number": {
    name: "时间与数字",
    description: "转换时间戳、进制和定时计划",
  },
  crypto: { name: "Hash 与标识", description: "生成摘要、UUID 并解码令牌" },
  files: { name: "文件与图片", description: "检查、转换和归档本地文件" },
  web: { name: "Web 开发", description: "构建请求、颜色、二维码和网页标记" },
};

export const zhTools: Record<string, LocalizedToolMetadata> = {
  "json-formatter": {
    name: "JSON 格式化",
    shortName: "JSON 格式化",
    description: "使用可配置缩进美化 JSON，并清晰显示语法错误。",
    keywords: ["json", "格式化", "美化", "缩进", "数据"],
    seoTitle: "JSON 在线格式化 — 美化与校验 JSON",
    seoDescription:
      "在浏览器本地快速格式化 JSON，支持语法校验和缩进设置，数据无需上传。",
    faq: [
      {
        question: "我的 JSON 会被上传吗？",
        answer: "不会。格式化完全在浏览器中完成，输入内容不会离开您的设备。",
      },
      {
        question: "最多可以输入多大的 JSON？",
        answer: "默认上限为 5 MB，并设有嵌套深度保护，避免浏览器卡顿。",
      },
    ],
  },
  "json-validator": {
    name: "JSON 校验",
    shortName: "JSON 校验",
    description: "检查 JSON 语法，并在内容无效时显示准确错误。",
    keywords: ["json", "校验", "验证", "语法", "检查"],
    seoTitle: "JSON 在线校验 — 检查 JSON 语法",
    seoDescription:
      "在浏览器本地校验 JSON 并定位语法错误，无需向服务器发送数据。",
    faq: [
      {
        question: "校验会检查哪些内容？",
        answer: "会检查 JSON 语法、输入大小和过深的嵌套结构。",
      },
    ],
  },
  "json-minifier": {
    name: "JSON 压缩",
    shortName: "JSON 压缩",
    description: "移除有效 JSON 中的空白，减小接口数据和测试文件体积。",
    keywords: ["json", "压缩", "精简", "去空格"],
    seoTitle: "JSON 在线压缩 — 精简 JSON",
    seoDescription: "在浏览器中安全压缩有效 JSON，并复制或下载结果。",
    faq: [
      {
        question: "压缩会改变数据吗？",
        answer: "不会。只会移除无意义的空白，解析后的 JSON 数据保持不变。",
      },
    ],
  },
  base64: {
    name: "Base64 编码 / 解码",
    shortName: "Base64",
    description: "将 UTF-8 文本编码为 Base64，或将 Base64 解码为可读文本。",
    keywords: ["base64", "编码", "解码", "utf8", "文本"],
    seoTitle: "Base64 在线编码与解码",
    seoDescription: "在浏览器中私密地编码和解码 UTF-8 Base64 文本。",
    faq: [
      {
        question: "支持中文和 Emoji 吗？",
        answer:
          "支持。文本通过 UTF-8 转换，因此可处理中文、Emoji 和其他非拉丁字符。",
      },
    ],
  },
  "url-encoder": {
    name: "URL 编码",
    shortName: "URL 编码",
    description: "将文本安全地进行百分号编码，用于 URL 路径和查询参数。",
    keywords: ["url", "uri", "百分号", "编码", "查询参数"],
    seoTitle: "URL 在线编码 — 百分号编码文本",
    seoDescription: "在浏览器中快速编码 URL 组件和查询参数值。",
    faq: [
      {
        question: "可以编码完整 URL 吗？",
        answer:
          "此工具采用 URL 组件编码，最适合处理单独的路径片段或查询参数值。",
      },
    ],
  },
  "url-decoder": {
    name: "URL 解码",
    shortName: "URL 解码",
    description: "解码百分号编码的 URL 组件和使用加号分隔的查询文本。",
    keywords: ["url", "uri", "百分号", "解码", "查询参数"],
    seoTitle: "URL 在线解码 — 解析百分号编码",
    seoDescription: "在本地解码 URL 编码文本，并清晰提示无效编码序列。",
    faq: [
      {
        question: "加号会被转换为空格吗？",
        answer:
          "会，与常见的 application/x-www-form-urlencoded 查询值保持一致。",
      },
    ],
  },
  "timestamp-converter": {
    name: "时间戳转换",
    shortName: "时间戳",
    description: "转换 Unix 秒、毫秒、ISO 日期、UTC 和本地时间。",
    keywords: ["unix", "时间戳", "日期", "时间", "utc", "毫秒"],
    seoTitle: "Unix 时间戳在线转换 — 时间戳转日期",
    seoDescription: "在 Unix 时间戳、ISO、UTC 和本地时区日期之间快速转换。",
    faq: [
      {
        question: "如何区分秒和毫秒？",
        answer: "绝对值小于 1000 亿的数字按秒处理，更大的值按毫秒处理。",
      },
    ],
  },
  "uuid-generator": {
    name: "UUID 生成器",
    shortName: "UUID",
    description: "批量生成最多 100 个加密安全的随机 UUID v4。",
    keywords: ["uuid", "guid", "随机", "标识符", "v4", "生成"],
    seoTitle: "UUID v4 在线生成器 — 批量随机 UUID",
    seoDescription: "在浏览器本地生成安全的 UUID v4，支持复制和下载。",
    faq: [
      {
        question: "UUID 如何生成？",
        answer: "使用浏览器 Web Crypto API 提供的 crypto.randomUUID 生成。",
      },
    ],
  },
  "hash-generator": {
    name: "Hash 生成器",
    shortName: "Hash",
    description: "生成 SHA-256、SHA-384、SHA-512、SHA-1 或 MD5 文本摘要。",
    keywords: ["hash", "哈希", "sha256", "sha512", "sha1", "md5", "摘要"],
    seoTitle: "Hash 在线生成 — SHA-256、SHA-512 与 MD5",
    seoDescription: "使用现代 Web Crypto 算法在本地计算常见文本 Hash。",
    faq: [
      {
        question: "可以用它存储密码吗？",
        answer:
          "不可以。密码存储应使用 Argon2 或 scrypt 等专用慢速算法，并为每个密码使用唯一盐值。",
      },
    ],
  },
  "text-counter": {
    name: "文本统计",
    shortName: "文本统计",
    description: "统计字符、单词、行、字节、数字、空白和中文字符。",
    keywords: ["文本", "字数", "字符", "单词", "字节", "行数", "统计"],
    seoTitle: "在线文本统计 — 字符、单词、行数与字节",
    seoDescription: "在浏览器中即时分析文本，提供支持 Unicode 的多项统计。",
    faq: [
      {
        question: "Emoji 能正确计数吗？",
        answer:
          "字符统计支持 Unicode 码点，但由多个码点组成的字形可能会被计为多个字符。",
      },
    ],
  },
  "case-converter": {
    name: "文本大小写转换",
    shortName: "大小写转换",
    description:
      "将文本转换为 camelCase、PascalCase、snake_case、kebab-case 等格式。",
    keywords: [
      "大小写",
      "驼峰",
      "camelcase",
      "pascal",
      "snake",
      "kebab",
      "命名",
    ],
    seoTitle: "文本大小写转换 — camelCase、snake_case 等",
    seoDescription: "在十种常用命名规则之间转换标识符和文本。",
    faq: [
      {
        question: "支持哪些分隔符？",
        answer: "支持空格、连字符、下划线、点、正斜杠、反斜杠和驼峰边界。",
      },
    ],
  },
  "text-diff": {
    name: "文本差异对比",
    shortName: "文本 Diff",
    description: "按行或字符对比两段文本，并导出精简差异结果。",
    keywords: ["diff", "差异", "对比", "文本", "变更", "比较"],
    seoTitle: "在线文本 Diff — 按行或字符对比",
    seoDescription: "在本地清晰对比文本新增和删除内容，并下载结果。",
    faq: [
      {
        question: "可以忽略空白差异吗？",
        answer: "可以，按行对比时可选择忽略空白变化。",
      },
    ],
  },
  "regex-tester": {
    name: "正则表达式测试",
    shortName: "正则测试",
    description: "测试 JavaScript 正则表达式，实时高亮匹配并统计数量。",
    keywords: ["regex", "正则", "表达式", "javascript", "匹配", "测试"],
    seoTitle: "正则表达式在线测试 — JavaScript Regex",
    seoDescription:
      "在本地测试 JavaScript 正则表达式，实时查看匹配并提供安全限制。",
    faq: [
      {
        question: "使用哪种正则语法？",
        answer: "使用浏览器提供的 JavaScript RegExp 实现。",
      },
      {
        question: "如何防止 ReDoS？",
        answer: "限制输入和表达式长度、匹配数量，并拒绝常见的嵌套量词模式。",
      },
    ],
  },
  "number-base-converter": {
    name: "数字进制转换",
    shortName: "进制转换",
    description: "在 2 到 36 进制之间转换任意精度整数。",
    keywords: ["二进制", "十进制", "十六进制", "八进制", "进制", "转换"],
    seoTitle: "在线进制转换 — 二进制、十进制与十六进制",
    seoDescription: "在 2 至 36 进制之间无精度损失地转换大整数。",
    faq: [
      {
        question: "支持大整数吗？",
        answer:
          "支持。转换使用 JavaScript BigInt，不会出现普通浮点数精度损失。",
      },
    ],
  },
  "color-converter": {
    name: "颜色转换",
    shortName: "颜色转换",
    description: "转换并预览 HEX、RGB 和 HSL 颜色，生成可用的 CSS 值。",
    keywords: ["颜色", "hex", "rgb", "hsl", "css", "取色器", "转换"],
    seoTitle: "在线颜色转换 — HEX、RGB 与 HSL",
    seoDescription: "转换 HEX 和 RGB 颜色，查看 HSL、预览颜色并复制 CSS。",
    faq: [
      {
        question: "支持哪些输入？",
        answer: "支持 3 位或 6 位 HEX、rgb(r,g,b) 以及以逗号分隔的 RGB 值。",
      },
    ],
  },
  "qr-code-generator": {
    name: "二维码生成器",
    shortName: "二维码",
    description: "生成可下载的 PNG 二维码，并设置尺寸和纠错等级。",
    keywords: ["二维码", "qr", "qrcode", "url", "png", "生成"],
    seoTitle: "二维码在线生成 — 下载 PNG",
    seoDescription: "在本地生成可自定义的二维码，并下载高清 PNG 图片。",
    faq: [
      {
        question: "二维码内容会被上传吗？",
        answer: "不会。二维码图像完全在浏览器中生成。",
      },
    ],
  },
  "curl-parser": {
    name: "cURL 解析器",
    shortName: "cURL 解析",
    description: "解析常见 cURL 命令中的请求方法、URL、请求头和请求体。",
    keywords: ["curl", "解析", "http", "api", "请求"],
    seoTitle: "cURL 在线解析 — 查看 HTTP 请求",
    seoDescription: "在本地将常见 cURL 命令解析为方法、URL、请求头和请求体。",
    faq: [
      {
        question: "工具会执行请求吗？",
        answer: "不会。工具只在本地解析命令，不会发送任何网络请求。",
      },
    ],
  },
  "curl-generator": {
    name: "cURL 生成器",
    shortName: "cURL 生成",
    description: "通过简单表单生成 cURL 或 JavaScript fetch 请求代码。",
    keywords: ["curl", "生成", "fetch", "http", "api", "请求"],
    seoTitle: "cURL 在线生成 — 构建 HTTP 请求",
    seoDescription: "在不发送 API 数据的情况下生成 cURL 和 fetch 请求代码。",
    faq: [
      {
        question: "会执行生成的请求吗？",
        answer: "不会。工具只生成源代码，您可以检查后自行运行。",
      },
    ],
  },
  "jwt-decoder": {
    name: "JWT 解码",
    shortName: "JWT 解码",
    description: "解码 JWT 头部、载荷和时间声明，不验证也不上传令牌。",
    keywords: ["jwt", "令牌", "token", "解码", "头部", "载荷", "声明"],
    seoTitle: "JWT 在线解码 — 查看头部与载荷",
    seoDescription: "在浏览器中私密解码 JWT 声明，并查看签发和过期时间。",
    faq: [
      {
        question: "解码能证明 JWT 有效吗？",
        answer: "不能。只有使用可信密钥完成加密验证后，才能确认令牌真实有效。",
      },
    ],
  },
  "cron-generator": {
    name: "Cron 表达式工具",
    shortName: "Cron",
    description: "校验 Cron 表达式、应用常用预设并预览后续运行时间。",
    keywords: ["cron", "定时", "计划", "crontab", "下次运行", "生成"],
    seoTitle: "Cron 表达式在线生成与运行预览",
    seoDescription:
      "使用预设构建和校验 Cron 计划，并查看接下来五次本地运行时间。",
    faq: [
      {
        question: "支持哪种 Cron 语法？",
        answer: "本地解析器支持标准五字段表达式和可选的秒字段。",
      },
    ],
  },
  "html-formatter": {
    name: "HTML 格式化",
    shortName: "HTML 格式化",
    description: "使用清晰结构和统一缩进美化 HTML。",
    keywords: ["html", "格式化", "美化", "prettier", "网页", "标记"],
    seoTitle: "HTML 在线格式化 — 美化网页标记",
    seoDescription: "在本地格式化 HTML，使用清晰缩进并支持复制或下载结果。",
    faq: [
      {
        question: "输入的 HTML 会被执行吗？",
        answer: "不会。输入内容仅作为源代码文本进行格式化和显示，不会被执行。",
      },
    ],
  },
  "image-workbench": {
    name: "图片工作台",
    shortName: "图片处理",
    description: "无需上传即可压缩、缩放、裁剪、转换、检查和编码图片。",
    keywords: [
      "图片",
      "压缩",
      "缩放",
      "裁剪",
      "png",
      "jpg",
      "webp",
      "base64",
      "exif",
      "favicon",
    ],
    seoTitle: "在线图片压缩、尺寸调整与格式转换",
    seoDescription:
      "在浏览器本地压缩、缩放和裁剪 PNG、JPG、WebP 图片，查看 EXIF 与颜色，或转换 Base64。",
    faq: [
      {
        question: "图片会被上传吗？",
        answer:
          "不会。图片解码、Canvas 转换、EXIF 解析和下载都在您的浏览器中完成。",
      },
      {
        question: "支持哪些输出格式？",
        answer: "现代浏览器可以输出 PNG、JPEG、WebP，以及 32×32 PNG Favicon。",
      },
    ],
  },
  "archive-workbench": {
    name: "ZIP、TAR 与 GZIP 工具",
    shortName: "归档工具",
    description: "安全解包 ZIP、TAR 和 GZIP，或在本地创建 ZIP 与 GZIP 文件。",
    keywords: ["zip", "解压", "tar", "gzip", "归档", "压缩", "解包"],
    seoTitle: "在线 ZIP、TAR 与 GZIP 解压和压缩",
    seoDescription:
      "在本地解包 ZIP、TAR、TAR.GZ 和 GZIP，或创建 ZIP 与 GZIP，并提供 Zip Slip 和 Zip Bomb 防护。",
    faq: [
      {
        question: "如何拦截危险压缩包？",
        answer:
          "解包器会拒绝路径穿越、绝对路径、超深目录、过多条目、超大输出和异常压缩比。",
      },
      {
        question: "解包时会上传文件吗？",
        answer: "不会。归档文件完全在浏览器中解析和解压。",
      },
    ],
  },
  "file-inspector": {
    name: "文件检查器",
    shortName: "文件信息",
    description: "查看文件信息、MIME 签名、Hash、十六进制内容、编码和大小。",
    keywords: ["文件", "mime", "hash", "十六进制", "编码", "大小", "元数据"],
    seoTitle: "在线文件检查 — MIME、Hash、Hex 与编码",
    seoDescription:
      "无需上传即可检查本地文件的 MIME、SHA/MD5、Hex、文本编码和精确大小。",
    faq: [
      {
        question: "MIME Type 如何确定？",
        answer:
          "优先使用已知二进制签名，其次参考文件扩展名和浏览器提供的类型。",
      },
    ],
  },
  "ssh-key-generator": {
    name: "SSH 密钥生成器",
    shortName: "SSH 密钥",
    description: "在本地生成 RSA、Ed25519 或 ECDSA SSH 密钥，并下载密钥文件。",
    keywords: [
      "ssh",
      "rsa",
      "ed25519",
      "ecdsa",
      "公钥",
      "私钥",
      "openssh",
      "pkcs8",
    ],
    seoTitle: "在线 SSH 密钥生成 — RSA、Ed25519 与 ECDSA",
    seoDescription:
      "在浏览器中私密生成 SSH 密钥，包括 OpenSSH 公钥和可下载的受保护私钥。",
    faq: [
      {
        question: "私钥会离开浏览器吗？",
        answer: "不会。密钥生成和私钥导出只使用浏览器本地加密 API。",
      },
      {
        question: "会生成哪种私钥格式？",
        answer:
          "Ed25519 使用 OpenSSH 私钥格式；RSA 和 ECDSA 使用可互操作的 PKCS#8，并可用口令加密。",
      },
    ],
  },
  "mime-type-lookup": {
    name: "MIME Type 查询",
    shortName: "MIME Type",
    description: "查询媒体类型、文件扩展名、字符集和压缩提示。",
    keywords: ["mime", "媒体类型", "content-type", "扩展名", "字符集"],
    seoTitle: "MIME Type 查询 — 扩展名与 Content-Type",
    seoDescription:
      "按扩展名或媒体类型查询 MIME Type，并查看字符集和压缩元数据。",
    faq: [
      {
        question: "可以按扩展名查询吗？",
        answer: "可以。可输入 json、.png、wasm 或完整的媒体类型。",
      },
    ],
  },
  "http-status-reference": {
    name: "HTTP 状态码查询",
    shortName: "HTTP 状态码",
    description: "按编号、名称、类别或含义查询标准 HTTP 响应状态码。",
    keywords: ["http", "状态码", "响应", "404", "500", "重定向", "错误码"],
    seoTitle: "HTTP 状态码查询 — 搜索 1xx 到 5xx",
    seoDescription:
      "查询标准 HTTP 状态码及其简要含义，并按信息、成功、重定向和错误响应筛选。",
    faq: [
      {
        question: "包含哪些状态码？",
        answer: "参考表覆盖 1xx 到 5xx 分类中的标准注册 HTTP 状态码。",
      },
    ],
  },
  "sql-formatter": {
    name: "SQL 格式化与美化",
    shortName: "SQL 格式化",
    description: "在本地格式化 Standard SQL、PostgreSQL、MySQL、SQLite 与 SQL Server 查询。",
    keywords: ["sql", "格式化", "美化", "postgresql", "mysql", "sqlite"],
    seoTitle: "SQL 在线格式化与美化",
    seoDescription: "在浏览器中按 SQL 方言格式化查询并调整关键字大小写。",
    faq: [
      { question: "支持哪些 SQL 方言？", answer: "支持 Standard SQL、PostgreSQL、MySQL、SQLite 与 SQL Server。" },
      { question: "查询会上传吗？", answer: "不会。解析和格式化完全在浏览器本地运行。" },
    ],
  },
  "css-formatter": {
    name: "CSS 格式化与压缩",
    shortName: "CSS 工具",
    description: "使用语法解析器在本地格式化或压缩 CSS。",
    keywords: ["css", "格式化", "美化", "压缩", "样式表"],
    seoTitle: "CSS 在线格式化与压缩",
    seoDescription: "在浏览器本地格式化和压缩 CSS，提供语法感知输出且无需上传。",
    faq: [{ question: "压缩会改变 CSS 行为吗？", answer: "压缩器基于 CSS 语法树执行保持语义的优化。" }],
  },
  "javascript-formatter": {
    name: "JavaScript 格式化与压缩",
    shortName: "JavaScript 工具",
    description: "使用语法解析器在本地格式化或压缩现代 JavaScript。",
    keywords: ["javascript", "js", "格式化", "美化", "压缩", "terser"],
    seoTitle: "JavaScript 在线格式化与压缩",
    seoDescription: "在浏览器本地美化和压缩 JavaScript，支持现代语法且无需上传。",
    faq: [{ question: "支持哪些 JavaScript 语法？", answer: "格式化器支持现代 ECMAScript，压缩前也会验证输入语法。" }],
  },
  "git-command-builder": {
    name: "Git 命令工作台",
    shortName: "Git 命令",
    description: "生成带安全引用的 clone、reset、rebase、cherry-pick 命令和分支名，并解析 Git URL。",
    keywords: ["git", "clone", "reset", "rebase", "cherry-pick", "分支", "github", "url"],
    seoTitle: "Git 命令与分支名在线生成",
    seoDescription: "生成安全引用的 Git 命令和分支名，或解析 HTTPS 与 SSH 仓库 URL。",
    faq: [{ question: "会自动执行命令吗？", answer: "不会。工作台只生成供您检查和复制的文本。" }],
  },
  "network-calculator": {
    name: "IP、CIDR、MAC 与 URL 计算器",
    shortName: "网络计算器",
    description: "在本地分析 IPv4、IPv6、CIDR 范围、子网掩码、MAC 格式和 URL 组成。",
    keywords: ["ipv4", "ipv6", "cidr", "子网", "ip 范围", "mac", "url 解析", "网络"],
    seoTitle: "IP CIDR 子网、MAC 与 URL 在线计算",
    seoDescription: "在浏览器中计算 IPv4/IPv6 网络、子网范围、MAC 格式与 URL 组成。",
    faq: [{ question: "会查询 IP 数据库吗？", answer: "不会。地址解析和子网计算均为浏览器本地数学运算。" }],
  },
  "api-request-builder": {
    name: "API 请求构建与测试",
    shortName: "API 测试",
    description: "生成 cURL、Fetch 和 Axios 请求，或在严格限制下从浏览器直接发送。",
    keywords: ["api", "rest", "http 请求", "测试", "curl", "fetch", "axios", "headers"],
    seoTitle: "API 请求构建与 REST 在线测试",
    seoDescription: "生成 cURL、Fetch、Axios 代码，或从浏览器直接测试启用 CORS 的 API。",
    faq: [
      { question: "请求会通过本站服务器代理吗？", answer: "不会。请求由浏览器直接发送，并遵从目标服务的 CORS 策略。" },
      { question: "有哪些安全限制？", answer: "请求 10 秒后超时，响应正文最大为 1 MB。" },
    ],
  },
  "http-header-builder": {
    name: "HTTP Header 与认证生成器",
    shortName: "Header 生成器",
    description: "生成 Bearer、Basic Auth 和 API Key 请求头，并输出 Header Lines、JSON 或 Fetch 格式。",
    keywords: ["http", "header", "请求头", "authorization", "bearer", "basic auth", "api key"],
    seoTitle: "HTTP Header、Bearer 与 Basic Auth 在线生成",
    seoDescription: "在浏览器本地生成 HTTP 请求头，以及 Bearer Token、Basic Auth 和 API Key 认证值。",
    faq: [
      { question: "认证信息会发送到网络吗？", answer: "不会。Header 生成完全在浏览器本地完成，不会发起网络请求。" },
      { question: "Basic Auth 会加密密码吗？", answer: "不会。Basic Auth 只是 Base64 编码，并非加密，必须配合 HTTPS 使用。" },
    ],
  },
  "webhook-tester": {
    name: "Webhook 测试与 Payload 格式化",
    shortName: "Webhook 测试",
    description: "格式化 JSON Payload、生成请求代码，并从浏览器直接发送出站 Webhook。",
    keywords: ["webhook", "payload", "json", "http post", "测试", "curl", "回调"],
    seoTitle: "Webhook 在线测试与 JSON Payload 格式化",
    seoDescription: "格式化 Webhook JSON，生成 cURL、Fetch 或 Axios 代码，并从浏览器测试支持 CORS 的目标地址。",
    faq: [
      { question: "请求会经过本站服务器吗？", answer: "不会。Webhook 由浏览器直接发送，并遵从目标服务的 CORS 策略。" },
      { question: "有哪些限制？", answer: "Payload 使用后台配置的工具上限，请求 10 秒后超时，响应正文最大为 1 MB。" },
    ],
  },
  "linux-cheatsheet": {
    name: "Linux 命令速查",
    shortName: "Linux 命令",
    description: "按任务搜索常用 Linux 文件、进程、网络和 systemd 命令。",
    keywords: ["linux", "shell", "命令", "systemd", "文件", "网络"],
    seoTitle: "Linux 命令在线速查",
    seoDescription: "按任务快速搜索并复制实用 Linux 命令。",
    faq: [{ question: "会自动执行命令吗？", answer: "不会。所有条目都只是供您检查和复制的参考文本。" }],
  },
  "git-cheatsheet": {
    name: "Git 命令速查",
    shortName: "Git 速查",
    description: "按任务搜索常用 Git 分支、差异、恢复和远端命令。",
    keywords: ["git", "命令", "分支", "diff", "reflog", "远端"],
    seoTitle: "Git 命令在线速查",
    seoDescription: "按任务快速搜索并复制实用 Git 命令。",
    faq: [{ question: "会自动执行命令吗？", answer: "不会。所有条目都只是供您检查和复制的参考文本。" }],
  },
  "docker-cheatsheet": {
    name: "Docker 命令速查",
    shortName: "Docker 命令",
    description: "按任务搜索常用 Docker 容器、镜像、构建和 Compose 命令。",
    keywords: ["docker", "容器", "镜像", "compose", "构建", "日志"],
    seoTitle: "Docker 命令在线速查",
    seoDescription: "按任务快速搜索并复制实用 Docker 与 Compose 命令。",
    faq: [{ question: "会自动执行命令吗？", answer: "不会。所有条目都只是供您检查和复制的参考文本。" }],
  },
  "nginx-cheatsheet": {
    name: "Nginx 配置速查",
    shortName: "Nginx 速查",
    description: "按任务搜索常用 Nginx 校验、反向代理、TLS 与 Header 配置。",
    keywords: ["nginx", "反向代理", "tls", "headers", "重载", "配置"],
    seoTitle: "Nginx 配置在线速查",
    seoDescription: "按任务快速搜索并复制实用 Nginx 命令与配置片段。",
    faq: [{ question: "会自动修改配置吗？", answer: "不会。所有条目都只是供您检查和复制的参考文本。" }],
  },
};
