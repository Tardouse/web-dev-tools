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
  "json-to-yaml": {
    name: "JSON 转 YAML",
    shortName: "JSON 转 YAML",
    description: "将 JSON 对象和数组转换为易读的 YAML，并保留基础值类型。",
    keywords: ["json", "yaml", "转换", "序列化", "配置"],
    seoTitle: "JSON 转 YAML 在线转换器",
    seoDescription:
      "在浏览器本地将 JSON 转为易读 YAML，保留值类型并应用严格输入限制。",
    faq: [
      {
        question: "字符串、布尔值和数字会保留类型吗？",
        answer: "会。工具先解析 JSON，再用 YAML 对应的基础类型序列化结果。",
      },
      {
        question: "转换会发送到服务器吗？",
        answer: "不会。转换在浏览器内受时间限制的 Web Worker 中完成。",
      },
    ],
  },
  "json-to-xml": {
    name: "JSON 转 XML",
    shortName: "JSON 转 XML",
    description: "将 JSON 转换为有效 XML，显式保留值类型和完整属性名。",
    keywords: ["json", "xml", "转换", "序列化", "数据"],
    seoTitle: "JSON 转 XML 在线转换器",
    seoDescription:
      "在本地将 JSON 转为经过转义且带类型的 XML，保留数组、null 和任意属性名。",
    faq: [
      {
        question: "JSON 属性名如何表示？",
        answer:
          "每个属性使用带 name 特性的 property 元素表示，因此空格等特殊键名也能无损保留并符合 XML 规范。",
      },
      {
        question: "数组和 null 如何表示？",
        answer:
          "数组使用重复的 item 元素，每个值都带有明确的 type 特性，包括 null。",
      },
    ],
  },
  "json-to-csv": {
    name: "JSON 转 CSV",
    shortName: "JSON 转 CSV",
    description: "将 JSON 数组或对象转换为适合表格使用的安全 CSV。",
    keywords: ["json", "csv", "表格", "转换", "数据"],
    seoTitle: "JSON 转 CSV 在线转换器",
    seoDescription:
      "在本地将 JSON 行转换为 CSV，支持合并表头、嵌套值和公式注入防护。",
    faq: [
      {
        question: "哪种 JSON 结构最适合转换？",
        answer:
          "对象数组会按对象生成多行；单个对象生成一行；基础值数组会使用 value 列。",
      },
      {
        question: "嵌套对象和数组如何处理？",
        answer:
          "嵌套值会作为 JSON 文本保存在单元格中，并对电子表格公式前缀进行转义。",
      },
    ],
  },
  "json-tree-viewer": {
    name: "JSON 树查看器",
    shortName: "JSON 树",
    description:
      "以可展开树浏览 JSON，显示类型、数量、深度统计并复制 JSONPath。",
    keywords: ["json", "树", "查看", "检查", "jsonpath", "结构"],
    seoTitle: "JSON 树在线查看器 — 浏览 JSON 结构",
    seoDescription:
      "使用可展开的本地树检查 JSON，查看值类型、节点统计、分页子项并复制 JSONPath。",
    faq: [
      {
        question: "可以处理大型数组吗？",
        answer:
          "可以。解析在受限制的 Web Worker 中运行，子节点每次渲染 100 项以保持界面响应。",
      },
      {
        question: "可以复制节点路径吗？",
        answer:
          "可以。每一行都能复制对应 JSONPath，包括带引号的键名和数组索引。",
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
  "file-base64": {
    name: "文件 Base64 转换",
    shortName: "文件 Base64",
    description:
      "将本地文件编码为原始 Base64 或 Data URL，也可将 Base64 解码为可下载文件。",
    keywords: ["base64", "文件", "data url", "二进制", "编码", "解码"],
    seoTitle: "文件转 Base64 在线工具 — 文件编码与解码",
    seoDescription:
      "在浏览器本地将文件转为 Base64，或解码 Base64 Data URL，支持 MIME 识别、文件下载和严格大小限制。",
    faq: [
      {
        question: "选择的文件会被上传吗？",
        answer:
          "不会。浏览器只在本地读取文件，并由受时间限制的 Web Worker 完成 Base64 转换。",
      },
      {
        question: "原始 Base64 和 Data URL 有什么区别？",
        answer:
          "Data URL 包含 MIME 类型和 Base64 标记，原始 Base64 只包含编码后的字节。",
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
  "url-parser": {
    name: "URL 解析器",
    shortName: "URL 解析",
    description:
      "将完整 URL 拆分为协议、凭据、主机、端口、路径、查询参数和片段。",
    keywords: ["url", "解析", "主机", "路径", "查询参数", "片段", "端口"],
    seoTitle: "URL 在线解析器 — 查看 URL 各组成部分",
    seoDescription:
      "在本地解析完整 URL，查看规范化协议、主机、路径片段、重复查询参数和片段。",
    faq: [
      {
        question: "重复查询参数会保留吗？",
        answer: "会。名称相同的重复参数会在 JSON 结果中以数组形式显示。",
      },
      {
        question: "解析器会发起网络请求吗？",
        answer: "不会。工具只使用浏览器的 URL 解析能力，不会连接输入的主机。",
      },
    ],
  },
  "query-string-parser": {
    name: "Query String 解析器",
    shortName: "查询参数解析",
    description:
      "将查询字符串或完整 URL 解析为已解码 JSON，并保留重复键和空值。",
    keywords: ["query string", "查询参数", "解析", "url 参数", "解码"],
    seoTitle: "Query String 在线解析 — URL 参数转 JSON",
    seoDescription:
      "在本地将 URL 查询参数解析为易读 JSON，支持重复键、加号空格和空值。",
    faq: [
      {
        question: "可以粘贴完整 URL 吗？",
        answer: "可以。解析器既接受完整 URL，也接受开头可带问号的查询字符串。",
      },
      {
        question: "名称相同的多个参数如何处理？",
        answer: "第一个值保持字符串形式，出现重复值时会按原始顺序组合为数组。",
      },
    ],
  },
  "query-string-generator": {
    name: "Query String 生成器",
    shortName: "查询参数生成",
    description: "通过有序键值行生成编码后的查询字符串，并支持重复参数名。",
    keywords: ["query string", "查询参数", "生成", "编码", "url 参数"],
    seoTitle: "Query String 在线生成器 — 构建 URL 查询参数",
    seoDescription:
      "通过可编辑键值行生成符合规范的 URL 查询字符串，支持重复键和可选开头问号。",
    faq: [
      {
        question: "同一个参数名可以出现多次吗？",
        answer: "可以。每一行都会按顺序追加，适用于数组式和重复查询参数。",
      },
      {
        question: "空格会如何编码？",
        answer:
          "生成器遵循 URLSearchParams 规则，在表单式查询字符串中将空格编码为加号。",
      },
    ],
  },
  "unicode-converter": {
    name: "Unicode 转义转换器",
    shortName: "Unicode 转换",
    description:
      "将文本编码为 Unicode 转义序列，或解码固定长度和码点转义写法。",
    keywords: ["unicode", "转义", "码点", "编码", "解码", "emoji"],
    seoTitle: "Unicode 在线编码与解码 — 转换转义序列",
    seoDescription:
      "在本地转换文本和 Unicode 转义序列，支持非 BMP 码点、Emoji 和代理项校验。",
    faq: [
      {
        question: "Emoji 如何编码？",
        answer:
          "BMP 以外的字符使用如 \\u{1F680} 的码点写法，也可以解码标准代理项对输入。",
      },
      {
        question: "无效代理项会被接受吗？",
        answer:
          "不会。孤立代理代码单元和超过 U+10FFFF 的数值都会返回明确错误。",
      },
    ],
  },
  "ascii-converter": {
    name: "ASCII 转换器",
    shortName: "ASCII 转换",
    description:
      "将 ASCII 文本转换为十进制、十六进制或二进制代码，也可解码混合代码写法。",
    keywords: ["ascii", "十进制", "十六进制", "二进制", "字符编码", "转换"],
    seoTitle: "ASCII 在线转换 — 文本、十进制、十六进制与二进制",
    seoDescription:
      "在本地将 ASCII 文本与字符代码在文本、十进制、十六进制和二进制之间转换。",
    faq: [
      {
        question: "可以解码哪些代码格式？",
        answer:
          "可输入普通十进制、0x 开头的十六进制或 0b 开头的二进制值，并用空格或逗号分隔。",
      },
      {
        question: "为什么不接受大于 127 的值？",
        answer:
          "本页专门处理原始 7 位 ASCII 标准，其他字符请使用 Unicode 工具。",
      },
    ],
  },
  "ascii-table": {
    name: "ASCII 字符表",
    shortName: "ASCII 表",
    description:
      "搜索全部 128 个 ASCII 控制字符和可打印字符，查看十进制、十六进制和二进制代码。",
    keywords: ["ascii", "字符表", "字符", "控制码", "十六进制", "二进制"],
    seoTitle: "ASCII 在线字符表 — 字符编码参考",
    seoDescription:
      "搜索完整 7 位 ASCII 表，查看控制字符名称、可打印字符及十进制、十六进制和二进制值。",
    faq: [
      {
        question: "字符表包含控制字符吗？",
        answer: "包含。0 至 31 和 127 均显示标准缩写和名称。",
      },
      {
        question: "可以只筛选可打印字符吗？",
        answer:
          "可以。使用分段筛选，或按字符、名称、十进制、十六进制和二进制代码搜索。",
      },
    ],
  },
  "utf8-inspector": {
    name: "UTF-8 编码查看器",
    shortName: "UTF-8 查看",
    description:
      "查看文本的 Unicode 码点、UTF-8 字节、字节数和 UTF-16 代码单元。",
    keywords: ["utf-8", "unicode", "字节", "十六进制", "码点", "编码"],
    seoTitle: "UTF-8 在线编码查看 — 字节与 Unicode 码点",
    seoDescription:
      "在本地查看文本的 UTF-8 字节、逐字符十六进制、Unicode 码点和字节统计。",
    faq: [
      {
        question: "为什么一个字符可能占多个字节？",
        answer:
          "ASCII 码点使用一个 UTF-8 字节，其他 Unicode 码点会使用两到四个字节。",
      },
      {
        question: "大段文本会导致表格卡顿吗？",
        answer:
          "分析在可终止 Worker 中进行，页面最多列出 1,000 个码点，同时保留完整输入的统计总数。",
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
    description:
      "在本地格式化 Standard SQL、PostgreSQL、MySQL、SQLite 与 SQL Server 查询。",
    keywords: ["sql", "格式化", "美化", "postgresql", "mysql", "sqlite"],
    seoTitle: "SQL 在线格式化与美化",
    seoDescription: "在浏览器中按 SQL 方言格式化查询并调整关键字大小写。",
    faq: [
      {
        question: "支持哪些 SQL 方言？",
        answer: "支持 Standard SQL、PostgreSQL、MySQL、SQLite 与 SQL Server。",
      },
      {
        question: "查询会上传吗？",
        answer: "不会。解析和格式化完全在浏览器本地运行。",
      },
    ],
  },
  "css-formatter": {
    name: "CSS 格式化与压缩",
    shortName: "CSS 工具",
    description: "使用语法解析器在本地格式化或压缩 CSS。",
    keywords: ["css", "格式化", "美化", "压缩", "样式表"],
    seoTitle: "CSS 在线格式化与压缩",
    seoDescription:
      "在浏览器本地格式化和压缩 CSS，提供语法感知输出且无需上传。",
    faq: [
      {
        question: "压缩会改变 CSS 行为吗？",
        answer: "压缩器基于 CSS 语法树执行保持语义的优化。",
      },
    ],
  },
  "javascript-formatter": {
    name: "JavaScript 格式化与压缩",
    shortName: "JavaScript 工具",
    description: "使用语法解析器在本地格式化或压缩现代 JavaScript。",
    keywords: ["javascript", "js", "格式化", "美化", "压缩", "terser"],
    seoTitle: "JavaScript 在线格式化与压缩",
    seoDescription:
      "在浏览器本地美化和压缩 JavaScript，支持现代语法且无需上传。",
    faq: [
      {
        question: "支持哪些 JavaScript 语法？",
        answer: "格式化器支持现代 ECMAScript，压缩前也会验证输入语法。",
      },
    ],
  },
  "git-command-builder": {
    name: "Git 命令工作台",
    shortName: "Git 命令",
    description:
      "生成带安全引用的 clone、reset、rebase、cherry-pick 命令和分支名，并解析 Git URL。",
    keywords: [
      "git",
      "clone",
      "reset",
      "rebase",
      "cherry-pick",
      "分支",
      "github",
      "url",
    ],
    seoTitle: "Git 命令与分支名在线生成",
    seoDescription:
      "生成安全引用的 Git 命令和分支名，或解析 HTTPS 与 SSH 仓库 URL。",
    faq: [
      {
        question: "会自动执行命令吗？",
        answer: "不会。工作台只生成供您检查和复制的文本。",
      },
    ],
  },
  "network-calculator": {
    name: "IP、CIDR、MAC 与 URL 计算器",
    shortName: "网络计算器",
    description:
      "在本地分析 IPv4、IPv6、CIDR 范围、子网掩码、MAC 格式和 URL 组成。",
    keywords: [
      "ipv4",
      "ipv6",
      "cidr",
      "子网",
      "ip 范围",
      "mac",
      "url 解析",
      "网络",
    ],
    seoTitle: "IP CIDR 子网、MAC 与 URL 在线计算",
    seoDescription:
      "在浏览器中计算 IPv4/IPv6 网络、子网范围、MAC 格式与 URL 组成。",
    faq: [
      {
        question: "会查询 IP 数据库吗？",
        answer: "不会。地址解析和子网计算均为浏览器本地数学运算。",
      },
    ],
  },
  "api-request-builder": {
    name: "API 请求构建与测试",
    shortName: "API 测试",
    description:
      "生成 cURL、Fetch 和 Axios 请求，或在严格限制下从浏览器直接发送。",
    keywords: [
      "api",
      "rest",
      "http 请求",
      "测试",
      "curl",
      "fetch",
      "axios",
      "headers",
    ],
    seoTitle: "API 请求构建与 REST 在线测试",
    seoDescription:
      "生成 cURL、Fetch、Axios 代码，或从浏览器直接测试启用 CORS 的 API。",
    faq: [
      {
        question: "请求会通过本站服务器代理吗？",
        answer: "不会。请求由浏览器直接发送，并遵从目标服务的 CORS 策略。",
      },
      {
        question: "有哪些安全限制？",
        answer: "请求 10 秒后超时，响应正文最大为 1 MB。",
      },
    ],
  },
  "http-header-builder": {
    name: "HTTP Header 与认证生成器",
    shortName: "Header 生成器",
    description:
      "生成 Bearer、Basic Auth 和 API Key 请求头，并输出 Header Lines、JSON 或 Fetch 格式。",
    keywords: [
      "http",
      "header",
      "请求头",
      "authorization",
      "bearer",
      "basic auth",
      "api key",
    ],
    seoTitle: "HTTP Header、Bearer 与 Basic Auth 在线生成",
    seoDescription:
      "在浏览器本地生成 HTTP 请求头，以及 Bearer Token、Basic Auth 和 API Key 认证值。",
    faq: [
      {
        question: "认证信息会发送到网络吗？",
        answer: "不会。Header 生成完全在浏览器本地完成，不会发起网络请求。",
      },
      {
        question: "Basic Auth 会加密密码吗？",
        answer:
          "不会。Basic Auth 只是 Base64 编码，并非加密，必须配合 HTTPS 使用。",
      },
    ],
  },
  "webhook-tester": {
    name: "Webhook 测试与 Payload 格式化",
    shortName: "Webhook 测试",
    description:
      "格式化 JSON Payload、生成请求代码，并从浏览器直接发送出站 Webhook。",
    keywords: [
      "webhook",
      "payload",
      "json",
      "http post",
      "测试",
      "curl",
      "回调",
    ],
    seoTitle: "Webhook 在线测试与 JSON Payload 格式化",
    seoDescription:
      "格式化 Webhook JSON，生成 cURL、Fetch 或 Axios 代码，并从浏览器测试支持 CORS 的目标地址。",
    faq: [
      {
        question: "请求会经过本站服务器吗？",
        answer: "不会。Webhook 由浏览器直接发送，并遵从目标服务的 CORS 策略。",
      },
      {
        question: "有哪些限制？",
        answer:
          "Payload 使用后台配置的工具上限，请求 10 秒后超时，响应正文最大为 1 MB。",
      },
    ],
  },
  "random-string-generator": {
    name: "随机字符串生成器",
    shortName: "随机字符串",
    description: "使用 Web Crypto 按指定长度和字符集生成安全随机字符串。",
    keywords: ["随机字符串", "token", "字符集", "安全", "web crypto"],
    seoTitle: "安全随机字符串在线生成器",
    seoDescription:
      "在浏览器本地使用 Web Crypto 生成随机字符串，可配置长度、字符集和易混淆字符过滤。",
    faq: [
      {
        question: "使用什么随机源？",
        answer: "工具使用 Web Crypto，而不是 Math.random()。",
      },
    ],
  },
  "password-generator": {
    name: "安全密码生成器",
    shortName: "密码生成器",
    description: "按字符类型生成强密码，并显示估算熵值。",
    keywords: ["密码", "安全", "熵", "随机", "web crypto"],
    seoTitle: "带熵估算的安全密码在线生成器",
    seoDescription:
      "使用 Web Crypto 在本地生成强密码，可配置字符类型并查看估算熵值。",
    faq: [
      {
        question: "生成的密码会上传吗？",
        answer: "不会。密码只在浏览器本地生成，不会上传或保存。",
      },
    ],
  },
  "username-generator": {
    name: "用户名生成器",
    shortName: "用户名生成",
    description: "组合形容词与名词，批量生成可读用户名并控制分隔符和数字后缀。",
    keywords: ["用户名", "昵称", "handle", "随机名称"],
    seoTitle: "随机用户名在线生成器",
    seoDescription:
      "在浏览器本地生成可读的随机用户名，可选择分隔符和数字后缀。",
    faq: [
      {
        question: "用户名一定全局唯一吗？",
        answer: "不会。工具只保证当前生成批次内不重复。",
      },
    ],
  },
  "lorem-ipsum-generator": {
    name: "Lorem Ipsum 生成器",
    shortName: "Lorem Ipsum",
    description: "按单词、句子或段落生成有界长度的占位文本。",
    keywords: ["lorem ipsum", "占位文本", "假文", "段落"],
    seoTitle: "Lorem Ipsum 占位文本在线生成",
    seoDescription: "即时生成指定数量的 Lorem Ipsum 单词、句子或段落。",
    faq: [
      {
        question: "一次最多生成多少？",
        answer: "单次最多 1,000 个单词、100 个句子或 20 个段落。",
      },
    ],
  },
  "fake-json-generator": {
    name: "Fake JSON 数据生成器",
    shortName: "Fake JSON",
    description: "生成包含 ID、邮箱、角色、日期、状态和分数的合成 JSON 记录。",
    keywords: ["fake json", "样例数据", "fixture", "mock json", "记录"],
    seoTitle: "Fake JSON 测试数据在线生成器",
    seoDescription:
      "在浏览器本地生成用于原型、测试和 Fixture 的合成 JSON 记录。",
    faq: [
      {
        question: "数据对应真实用户吗？",
        answer: "不会。所有记录都是在本地随机生成的合成数据。",
      },
    ],
  },
  "mock-data-generator": {
    name: "Mock CSV 数据生成器",
    shortName: "Mock 数据",
    description: "生成用于本地测试、Fixture 和表格的合成 CSV 用户记录。",
    keywords: ["mock data", "csv", "fixture", "样例记录", "测试数据"],
    seoTitle: "Mock CSV 测试数据在线生成器",
    seoDescription:
      "在浏览器本地创建包含 ID、邮箱、角色、国家和状态的合成 CSV 数据。",
    faq: [
      {
        question: "单次最多生成多少行？",
        answer: "每批最多 100 行，以保持浏览器响应流畅。",
      },
    ],
  },
  "random-number-generator": {
    name: "随机数生成器",
    shortName: "随机数",
    description: "按范围生成整数或小数，并控制数量、精度和是否去重。",
    keywords: ["随机数", "整数", "小数", "范围", "不重复"],
    seoTitle: "可设置范围与精度的随机数在线生成器",
    seoDescription:
      "在本地生成指定范围的整数或小数，可配置数量、精度和唯一性。",
    faq: [
      {
        question: "可以避免重复吗？",
        answer: "可以，但所选范围和精度必须能容纳请求的唯一数量。",
      },
    ],
  },
  "random-date-generator": {
    name: "随机日期生成器",
    shortName: "随机日期",
    description:
      "在指定范围内生成排序后的随机日期，并输出 ISO、日期或 Unix 格式。",
    keywords: ["随机日期", "日期范围", "iso 8601", "unix 时间戳"],
    seoTitle: "ISO 与 Unix 随机日期在线生成器",
    seoDescription:
      "在指定日期范围内生成随机值，并导出 ISO 8601、YYYY-MM-DD 或 Unix 格式。",
    faq: [
      {
        question: "支持哪些日期格式？",
        answer: "支持 ISO 8601、YYYY-MM-DD 和 Unix 秒。",
      },
    ],
  },
  "random-color-generator": {
    name: "随机颜色生成器",
    shortName: "随机颜色",
    description: "生成可检查的颜色色块，并复制 HEX、RGB 或 HSL CSS 值。",
    keywords: ["随机颜色", "hex", "rgb", "hsl", "css", "色块"],
    seoTitle: "随机 HEX、RGB 与 HSL 颜色在线生成器",
    seoDescription:
      "在浏览器本地生成随机色块，并复制有效的 HEX、RGB 或 HSL CSS 值。",
    faq: [
      {
        question: "颜色可以直接作为 CSS 使用吗？",
        answer: "可以。切换 HEX、RGB 或 HSL 后即可复制对应值。",
      },
    ],
  },
  "linux-cheatsheet": {
    name: "Linux 命令速查",
    shortName: "Linux 命令",
    description: "按任务搜索常用 Linux 文件、进程、网络和 systemd 命令。",
    keywords: ["linux", "shell", "命令", "systemd", "文件", "网络"],
    seoTitle: "Linux 命令在线速查",
    seoDescription: "按任务快速搜索并复制实用 Linux 命令。",
    faq: [
      {
        question: "会自动执行命令吗？",
        answer: "不会。所有条目都只是供您检查和复制的参考文本。",
      },
    ],
  },
  "git-cheatsheet": {
    name: "Git 命令速查",
    shortName: "Git 速查",
    description: "按任务搜索常用 Git 分支、差异、恢复和远端命令。",
    keywords: ["git", "命令", "分支", "diff", "reflog", "远端"],
    seoTitle: "Git 命令在线速查",
    seoDescription: "按任务快速搜索并复制实用 Git 命令。",
    faq: [
      {
        question: "会自动执行命令吗？",
        answer: "不会。所有条目都只是供您检查和复制的参考文本。",
      },
    ],
  },
  "docker-cheatsheet": {
    name: "Docker 命令速查",
    shortName: "Docker 命令",
    description: "按任务搜索常用 Docker 容器、镜像、构建和 Compose 命令。",
    keywords: ["docker", "容器", "镜像", "compose", "构建", "日志"],
    seoTitle: "Docker 命令在线速查",
    seoDescription: "按任务快速搜索并复制实用 Docker 与 Compose 命令。",
    faq: [
      {
        question: "会自动执行命令吗？",
        answer: "不会。所有条目都只是供您检查和复制的参考文本。",
      },
    ],
  },
  "nginx-cheatsheet": {
    name: "Nginx 配置速查",
    shortName: "Nginx 速查",
    description: "按任务搜索常用 Nginx 校验、反向代理、TLS 与 Header 配置。",
    keywords: ["nginx", "反向代理", "tls", "headers", "重载", "配置"],
    seoTitle: "Nginx 配置在线速查",
    seoDescription: "按任务快速搜索并复制实用 Nginx 命令与配置片段。",
    faq: [
      {
        question: "会自动修改配置吗？",
        answer: "不会。所有条目都只是供您检查和复制的参考文本。",
      },
    ],
  },
  "vim-cheatsheet": {
    name: "Vim 命令速查",
    shortName: "Vim 速查",
    description: "按导航、编辑、搜索、替换和文件操作查找常用 Vim 命令。",
    keywords: ["vim", "编辑器", "命令", "导航", "替换", "快捷键"],
    seoTitle: "Vim 常用命令在线速查",
    seoDescription: "搜索并复制常用 Vim 导航、编辑、搜索、替换和文件命令。",
    faq: [
      {
        question: "会修改本地文件吗？",
        answer: "不会。页面只提供可搜索和复制的 Vim 命令参考。",
      },
    ],
  },
  "regex-cheatsheet": {
    name: "正则表达式速查",
    shortName: "Regex 速查",
    description: "按锚点、字符类、分组、环视和量词查找常用正则语法。",
    keywords: ["regex", "正则表达式", "模式", "分组", "环视", "量词"],
    seoTitle: "正则表达式语法在线速查",
    seoDescription:
      "搜索并复制常用正则表达式锚点、字符类、分组、边界和量词模式。",
    faq: [
      {
        question: "这些模式会自动运行吗？",
        answer: "不会。可复制模式到正则测试器中按实际输入验证。",
      },
    ],
  },
  "bash-cheatsheet": {
    name: "Bash 脚本速查",
    shortName: "Bash 速查",
    description: "查找 Bash 安全选项、参数、循环、输入、清理和条件分支示例。",
    keywords: ["bash", "shell", "脚本", "pipefail", "循环", "trap"],
    seoTitle: "Bash Shell 脚本在线速查",
    seoDescription:
      "搜索并复制常用 Bash 安全设置、参数处理、循环、trap 和条件语句。",
    faq: [
      {
        question: "会执行 Shell 命令吗？",
        answer: "不会。所有脚本片段都只在页面中显示，复制前应先检查。",
      },
    ],
  },
  "sql-cheatsheet": {
    name: "SQL 语句速查",
    shortName: "SQL 速查",
    description: "查找查询、连接、聚合、写入、事务、CTE 和执行计划示例。",
    keywords: ["sql", "select", "join", "group by", "事务", "cte", "explain"],
    seoTitle: "常用 SQL 语句在线速查",
    seoDescription:
      "搜索并复制常用 SQL 查询、连接、聚合、写入、事务和 CTE 示例。",
    faq: [
      {
        question: "SQL 会连接数据库执行吗？",
        answer: "不会。页面只提供数据库无关的参考语句。",
      },
    ],
  },
  "javascript-cheatsheet": {
    name: "JavaScript 语法速查",
    shortName: "JavaScript 速查",
    description:
      "查找对象、数组、异步、集合、模块和 JSON 的现代 JavaScript 写法。",
    keywords: ["javascript", "js", "异步", "数组", "对象", "模块"],
    seoTitle: "现代 JavaScript 语法在线速查",
    seoDescription:
      "搜索并复制现代 JavaScript 解构、数组、异步、集合、模块和 JSON 示例。",
    faq: [
      {
        question: "代码会在页面中运行吗？",
        answer: "不会。代码片段只用于参考和复制。",
      },
    ],
  },
  "python-cheatsheet": {
    name: "Python 语法速查",
    shortName: "Python 速查",
    description:
      "查找虚拟环境、依赖、推导式、迭代、文件、JSON 和异常处理示例。",
    keywords: ["python", "venv", "pip", "推导式", "pathlib", "json"],
    seoTitle: "Python 常用语法在线速查",
    seoDescription:
      "搜索并复制 Python 虚拟环境、推导式、迭代、文件、JSON 和异常示例。",
    faq: [
      {
        question: "会执行 Python 代码吗？",
        answer: "不会。页面只显示可搜索和复制的代码参考。",
      },
    ],
  },
  "http-status-code-cheatsheet": {
    name: "HTTP 状态码速查",
    shortName: "HTTP 状态码",
    description: "快速查看常用成功、重定向、客户端错误和服务器错误状态码。",
    keywords: ["http", "状态码", "200", "404", "429", "500", "响应"],
    seoTitle: "常用 HTTP 状态码在线速查",
    seoDescription:
      "快速搜索并复制常用 HTTP 2xx、3xx、4xx 和 5xx 状态码及语义。",
    faq: [
      {
        question: "与完整状态码查询有什么区别？",
        answer:
          "此页面提供高频状态码速查；完整查询页包含更广的标准状态码集合。",
      },
    ],
  },
  "css-cheatsheet": {
    name: "CSS 样式速查",
    shortName: "CSS 速查",
    description:
      "查找尺寸、Flexbox、Grid、响应式字号、变量、媒体查询和溢出片段。",
    keywords: ["css", "flexbox", "grid", "clamp", "媒体查询", "布局"],
    seoTitle: "常用 CSS 布局与样式在线速查",
    seoDescription:
      "搜索并复制常用 CSS 尺寸、Flexbox、Grid、clamp、媒体查询和溢出片段。",
    faq: [
      {
        question: "片段会修改当前页面吗？",
        answer: "不会。所有 CSS 都只作为文本显示和复制。",
      },
    ],
  },
};
