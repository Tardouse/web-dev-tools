# 开发者在线工具箱

## 敏捷开发模式开发清单

> 状态更新：2026-08-16。`[x]` 仅表示当前仓库已有可运行实现并通过现有自动化验证；未勾选项仍在后续计划中。部分 Sprint 已交付核心范围，但仍可能保留未完成的增强项。

### 当前交付概览

- 第一版建议工具：20 / 20 已完成，仓库实际注册 37 个独立工具
- P0 必须项：19 / 19 已完成
- P1 第一阶段项：11 / 11 已完成
- Sprint 5：图片、归档、文件检查、SSH Key、MIME Type 与 HTTP Status Code 已完成，并通过桌面/移动端 E2E
- Sprint 6：邮箱验证与找回密码已完成，包含单次令牌、双重限流、SMTP / 测试 outbox 和会话撤销，并通过桌面/移动端 E2E
- Sprint 7：工具管理与系统设置已完成，包含双语工具配置、访问策略、全局站点开关、容量/API 限额和维护模式，并通过桌面/移动端 E2E
- Sprint 8：SEO、Sitemap、搜索、相关推荐、FAQ、Analytics 与按需加载已完成，并通过聚合 E2E 验收
- Sprint 9：SQL、Web 代码处理、Git、网络分析、浏览器 API 请求与 Linux/Git/Docker/Nginx 速查已完成，并通过桌面/移动端 E2E
- 用户与后台：已完成 Email 注册验证、登录与密码恢复、用户/管理员认证隔离、收藏与最近使用、运营 Dashboard 和用户管理
- 工程化：已具备单元、集成和 E2E 测试、GitHub Actions CI 及生产部署配置；实际域名、HTTPS 证书和 CD 尚未落地

### 1. 项目定位

开发一个面向程序员、开发人员、运维人员、学生及技术从业者的在线开发工具网站。

核心特点：

- 打开即用
- 大部分工具无需登录
- 工具操作尽可能在浏览器本地完成
- 简洁、快速、美观
- 工具页面独立、URL 可访问
- 支持桌面端和移动端
- 支持浅色/深色模式
- 后期支持用户系统、收藏、历史记录、会员、广告及 API
- 具有完善的后台管理系统
- 采用敏捷开发模式，优先完成 MVP，再逐步扩展

---

# 2. 整体产品结构

建议网站分为：

```text
首页
├── 工具分类
│   ├── JSON / 数据
│   ├── 编码 / 解码
│   ├── URL / HTTP
│   ├── 时间 / 日期
│   ├── 数字 / 进制
│   ├── 文本
│   ├── 正则
│   ├── Hash / 加密
│   ├── 网络
│   ├── 图片
│   ├── 文件
│   ├── Git
│   ├── SSH
│   ├── CSS / HTML
│   ├── JavaScript
│   ├── SQL
│   ├── 开发辅助
│   └── 其他
│
├── 搜索
├── 登录 / 注册
├── 我的工具
├── 收藏
├── 使用历史
├── 用户中心
└── 管理后台
```

---

# 3. UI / UX 设计要求

## 3.1 整体风格

采用：

- 浅色调作为默认主题
- 支持深色/夜间模式
- 简洁
- 专业
- 克制
- 有层次感
- 不要过度使用渐变
- 不要大量玻璃拟态
- 不要过度使用 AI 风格的发光效果
- 不要让网站看起来像 AI 聊天工具
- 重点突出工具本身

整体感觉应该更接近：

```text
专业开发者工具
+
现代 SaaS
+
简洁文档网站
```

而不是：

```text
AI Chat
AI Agent
霓虹灯
大面积渐变
```

## 3.2 页面布局

建议：

```text
┌──────────────────────────────────────────────┐
│ Logo       工具分类   搜索       🌙 登录     │
├──────────────────────────────────────────────┤
│                                              │
│             开发者工具箱                     │
│       常用工具，一站式解决开发问题           │
│                                              │
│              [ 搜索工具 ]                    │
│                                              │
├──────────────────────────────────────────────┤
│ 常用工具                                     │
│                                              │
│ [JSON] [Base64] [URL] [时间戳] [Hash]        │
│                                              │
├──────────────────────────────────────────────┤
│ 工具分类                                     │
│                                              │
│ 数据处理    编码转换    网络工具              │
│ 文本工具    文件工具    开发工具              │
└──────────────────────────────────────────────┘
```

工具页面建议统一采用：

```text
页面标题
工具说明

┌────────────────────────────────────────────┐
│ 输入区域                                   │
│                                            │
│                                            │
└────────────────────────────────────────────┘

[操作按钮] [清空] [复制] [下载]

┌────────────────────────────────────────────┐
│ 输出区域                                   │
│                                            │
└────────────────────────────────────────────┘

使用说明
常见问题
相关工具
```

---

# 4. 第一阶段：MVP

目标：

> 先做出一个真正可以使用的网站，而不是先做复杂后台。

## Sprint 1：基础框架

- [x] 创建前端项目
- [x] 创建后端项目
- [x] 配置数据库
- [x] 配置开发环境
- [x] 配置生产环境
- [ ] 配置 HTTPS
- [ ] 配置域名
- [x] 配置 Nginx / 反向代理
- [x] 配置日志
- [x] 配置错误处理
- [x] 配置环境变量
- [x] 配置 Docker
- [x] 建立 Git 仓库
- [ ] 建立 CI/CD
- [x] 建立基础组件库
- [x] 建立统一 Layout
- [x] 建立响应式布局

## Sprint 2：网站基础 UI

- [x] 首页
- [x] 工具分类页面
- [x] 工具详情页面
- [x] 工具搜索
- [x] Header
- [x] Footer
- [x] Breadcrumb
- [x] 工具卡片
- [x] 搜索框
- [x] Toast
- [x] Modal
- [x] Loading
- [x] Error 状态
- [x] Empty 状态
- [x] 复制按钮
- [x] 下载按钮
- [x] 清空按钮
- [x] 深色模式
- [x] 浅色模式
- [x] 移动端适配

---

# 5. 第一批核心工具

第一批不要超过 15～20 个。

优先开发：

## JSON

- [x] JSON 格式化
- [x] JSON 压缩
- [x] JSON 校验
- [ ] JSON 转 YAML
- [ ] JSON 转 XML
- [ ] JSON 转 CSV
- [ ] JSON Tree Viewer

限制：

- 最大输入长度：例如 5 MB
- 防止极深 JSON 导致浏览器卡死
- 循环处理超时保护
- 超大数据禁止格式化

---

# 6. 编码 / 解码工具

## Base64

- [x] Base64 编码
- [x] Base64 解码
- [x] 文本 Base64
- [ ] 文件 Base64
- [ ] 图片 Base64
- [ ] 自动识别编码

限制：

- 文本最大长度
- 文件最大大小
- 防止超大文件导致浏览器内存占用

## URL

- [x] URL Encode
- [x] URL Decode
- [ ] URL Parser
- [ ] Query String Parser
- [ ] Query String Generator

## Unicode

- [ ] Unicode 编码
- [ ] Unicode 解码
- [ ] ASCII 转换
- [ ] ASCII 字符查看
- [ ] UTF-8 编码查看

---

# 7. 进制与数字工具

- [x] 二进制 → 十进制
- [x] 二进制 → 十六进制
- [x] 十进制 → 二进制
- [x] 十进制 → 十六进制
- [x] 十六进制 → 十进制
- [x] 十六进制 → 二进制
- [x] 任意进制转换
- [ ] Bit / Byte 转换
- [ ] KB / MB / GB 转换
- [x] Unix Timestamp 转换
- [x] 时间戳 → 日期
- [x] 日期 → 时间戳

---

# 8. 文本工具

这一类非常适合做流量入口。

- [x] 字符数统计
- [x] 字节数统计
- [x] 单词数统计
- [x] 行数统计
- [x] 中文字符统计
- [ ] 英文字符统计
- [x] 数字统计
- [x] 空格统计
- [ ] 删除空行
- [ ] 删除重复行
- [ ] 行排序
- [ ] 行反转
- [ ] 添加行号
- [ ] 删除行号
- [ ] 文本去重
- [ ] 文本合并
- [ ] 文本拆分

---

# 9. 大小写转换

- [x] 全部大写
- [x] 全部小写
- [ ] 首字母大写
- [x] 每个单词首字母大写
- [x] camelCase
- [x] PascalCase
- [x] snake_case
- [x] kebab-case
- [x] CONSTANT_CASE
- [x] dot.case
- [x] path/case

---

# 10. 正则表达式

建议做成一个比较完整的 Regex Playground。

- [x] 正则表达式测试
- [x] 实时匹配
- [x] 匹配结果高亮
- [ ] 捕获组显示
- [ ] 替换测试
- [x] Match 数量统计
- [ ] 常用正则模板
- [ ] Regex 解释
- [x] Flags 设置
- [x] JavaScript Regex
- [ ] PCRE 说明

限制：

- 最大输入长度
- 最大正则长度
- 防止 ReDoS
- 设置执行超时
- 禁止危险表达式长时间运行

---

# 11. 文本差异比较

- [x] 两段文本 Diff
- [x] 行级 Diff
- [x] 字符级 Diff
- [x] Unified Diff
- [ ] JSON Diff
- [x] 忽略空格
- [ ] 忽略大小写
- [x] 显示新增
- [x] 显示删除
- [x] 显示修改
- [x] Diff 下载

---

# 12. Curl 工具

这是非常值得做的一组工具。

## Curl Parser

输入：

```bash
curl -X POST https://example.com/api \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
```

自动解析：

```text
Method
URL
Headers
Query
Cookies
Body
```

## Curl Generator

提供表单：

```text
Method
URL
Headers
Query Parameters
Cookies
Body
```

生成：

- [x] curl
- [x] JavaScript fetch
- [ ] Axios
- [ ] Python requests
- [ ] Python httpx
- [ ] Go HTTP
- [ ] PHP cURL
- [ ] Java
- [ ] C#
- [ ] JavaScript XMLHttpRequest

---

# 13. 颜色工具

- [x] HEX → RGB
- [x] RGB → HEX
- [x] RGB → HSL
- [ ] HSL → RGB
- [ ] HSV 转换
- [ ] CMYK 转换
- [x] 颜色选择器
- [x] 颜色预览
- [ ] 随机颜色
- [ ] 调色板生成
- [ ] 对比色
- [ ] 互补色
- [ ] CSS Color Generator

例如：

```text
#3B82F6

RGB
59, 130, 246

HSL
217, 91%, 60%

Preview
████████
```

---

# 14. 二维码工具

- [x] 文本 → QR Code
- [x] URL → QR Code
- [ ] WiFi → QR Code
- [ ] Email → QR Code
- [ ] vCard → QR Code
- [x] QR Code 下载
- [x] PNG
- [ ] SVG
- [x] 自定义尺寸
- [x] 自定义纠错等级

同时增加：

- [ ] QR Code 扫描 / 解析

如果使用文件上传，需要设置大小限制。

---

# 15. SSH 工具

## SSH Key Generator

支持：

- [x] RSA
- [x] ED25519
- [x] ECDSA
- [x] 密钥长度选择
- [x] Passphrase
- [x] Public Key
- [x] Private Key
- [x] OpenSSH 格式
- [x] 下载密钥

重要安全要求：

> 私钥必须在浏览器本地生成，不得上传服务器。

页面明确提示：

```text
Your private key is generated locally
and is never uploaded to the server.
```

---

# 16. Hash / 加密工具

建议加入：

- [x] MD5
- [x] SHA-1
- [x] SHA-256
- [x] SHA-384
- [x] SHA-512
- [ ] SHA3
- [ ] HMAC
- [ ] CRC32
- [x] UUID Generator
- [ ] UUID Validator

注意：

MD5 / SHA-1 可以提供，但明确标记其用途，不要把它们宣传为安全密码算法。

---

# 17. 文件工具

这是第二阶段重点。

- [x] 在线 ZIP 解压
- [x] ZIP 压缩
- [x] TAR 解包
- [x] GZIP 解压
- [x] GZIP 压缩
- [x] 文件信息查看
- [x] MIME Type 查询
- [x] 文件大小转换
- [x] 文件 Hash
- [x] 文件 Hex Viewer
- [x] 文本文件编码检测

文件工具统一设置：

```text
最大文件大小
最大解压后大小
最大文件数量
最大压缩层级
最大处理时间
```

尤其要防止 ZIP Bomb。

---

# 18. 图片工具

建议补充：

- [x] 图片压缩
- [x] 图片尺寸调整
- [x] 图片裁剪
- [x] 图片格式转换
- [x] PNG → JPG
- [x] JPG → PNG
- [x] WebP 转换
- [x] 图片 Base64
- [x] Base64 → 图片
- [x] 图片 EXIF 查看
- [x] 图片颜色分析
- [x] 图片平均颜色
- [x] Favicon Generator

尽量让图片处理在浏览器本地完成。

---

# 19. HTML / CSS 工具

建议增加：

- [x] HTML 格式化
- [x] HTML 压缩
- [x] CSS 格式化
- [x] CSS 压缩
- [x] JavaScript 格式化
- [x] JavaScript 压缩
- [x] HTML Entity Encode
- [x] HTML Entity Decode
- [ ] CSS Gradient Generator
- [ ] CSS Box Shadow Generator
- [ ] CSS Border Radius Generator
- [ ] CSS Flex Generator
- [ ] CSS Grid Generator
- [ ] CSS Clamp Generator

这些工具非常适合开发者使用，也适合 SEO。

---

# 20. SQL 工具

- [x] SQL Formatter
- [ ] SQL Minifier
- [x] SQL Beautifier
- [ ] SQL → JSON
- [ ] JSON → SQL
- [ ] SQL Query Builder
- [ ] SQL Syntax Checker
- [ ] INSERT Generator
- [ ] UPDATE Generator
- [ ] CREATE TABLE Generator

---

# 21. Git 工具

建议增加一组 Git 工具。

- [x] Git Command Generator
- [x] Git Branch Name Generator
- [ ] Gitignore Generator
- [ ] Git Diff Viewer
- [ ] Git Commit Message Generator
- [x] Git URL Parser
- [x] GitHub URL Parser
- [x] Git Clone Command Generator
- [x] Git Reset Command Generator
- [x] Git Rebase Command Generator
- [x] Git Cherry-pick Command Generator

---

# 22. 网络工具

建议：

- [x] IPv4 转换
- [x] IPv6 转换
- [x] IP 地址信息
- [x] CIDR Calculator
- [x] Subnet Calculator
- [x] IP Range Calculator
- [x] MAC 地址格式化
- [x] HTTP Status Code 查询
- [ ] HTTP Header 查询
- [x] MIME Type 查询
- [ ] User-Agent Parser
- [x] URL Parser
- [ ] DNS Record 查询

注意：

涉及服务器端网络请求的工具需要特别考虑 SSRF 风险。

不要直接允许：

```text
用户输入 URL
↓
服务器直接请求
```

必须进行：

- 内网 IP 拦截
- localhost 拦截
- 私有网段拦截
- 云 Metadata 地址拦截
- DNS Rebinding 防护
- 请求超时
- 响应大小限制

---

# 23. 时间工具

- [x] Unix Timestamp
- [x] Unix Timestamp Millisecond
- [x] 时间格式转换
- [x] ISO 8601
- [x] UTC 转本地时间
- [ ] 时区转换
- [ ] 时间差计算
- [ ] 日期加减
- [x] Cron Expression Generator
- [x] Cron Expression Parser
- [x] Cron Next Run

其中：

> Cron Generator 非常适合开发者，也很适合搜索引擎流量。

---

# 24. JWT 工具

建议重点加入：

- [x] JWT Decoder
- [x] JWT Header 查看
- [x] JWT Payload 查看
- [x] JWT 时间解析
- [ ] JWT Generator
- [ ] JWT Validator

安全要求：

默认强调：

```text
JWT decoding is performed locally.
Do not enter sensitive production tokens.
```

如果支持 JWT 签名验证，应明确区分：

```text
Decode
Verify
Generate
```

---

# 25. API 开发工具

可以逐渐发展成一个小型 API 工具箱。

- [x] HTTP Request Builder
- [x] API Request Generator
- [x] REST API Tester
- [ ] HTTP Header Generator
- [ ] Authorization Header Generator
- [ ] Bearer Token Generator
- [ ] Basic Auth Generator
- [ ] Webhook Tester
- [ ] Webhook Payload Formatter

Webhook / HTTP 请求功能必须严格控制服务器端网络访问能力，优先采用浏览器端请求。

---

# 26. 开发者随机生成器

这类工具实现简单，但使用频率很高。

- [x] UUID Generator
- [ ] Random String Generator
- [ ] Password Generator
- [ ] Username Generator
- [ ] Lorem Ipsum Generator
- [ ] Fake JSON Generator
- [ ] Mock Data Generator
- [ ] Random Number Generator
- [ ] Random Date Generator
- [ ] Random Color Generator

---

# 27. Developer Cheatsheet

可以增加：

- [x] Linux Command Cheatsheet
- [x] Git Cheatsheet
- [x] Docker Cheatsheet
- [x] Nginx Cheatsheet
- [ ] Vim Cheatsheet
- [ ] Regex Cheatsheet
- [ ] Bash Cheatsheet
- [ ] SQL Cheatsheet
- [ ] JavaScript Cheatsheet
- [ ] Python Cheatsheet
- [ ] HTTP Status Code Cheatsheet
- [ ] CSS Cheatsheet

这个模块对于 SEO 和长期流量非常有价值。

---

# 28. 工具统一限制机制

所有工具必须拥有统一的限制机制。

## 文本限制

例如：

```text
普通工具：
最大 1 MB

复杂解析：
最大 5 MB

JSON：
最大 5 MB

Regex：
最大 500 KB

Diff：
最大 2 MB
```

具体数值允许后台配置。

## 文件限制

例如：

```text
普通文件：
10 MB

图片：
20 MB

ZIP：
50 MB
```

同样必须后台可配置。

## 计算限制

所有可能造成高 CPU / 高内存消耗的操作必须有：

- [ ] 最大执行时间
- [x] 最大输入
- [ ] 最大输出
- [x] 最大递归深度
- [x] 最大文件数量
- [x] 最大解压大小
- [ ] 最大并发数

---

# 29. 本地处理原则

能在浏览器处理的工具：

> 优先浏览器本地处理。

例如：

- JSON
- Base64
- Hash
- UUID
- QR Code
- 文本统计
- Diff
- Regex
- SSH Key
- 图片处理
- 编码转换
- 颜色转换
- JWT Decode

这样可以：

- 降低服务器成本
- 提高速度
- 提高隐私性
- 降低数据库压力
- 降低服务器安全风险

页面可以明确展示：

```text
✓ Processed locally in your browser
```

这本身也可以成为产品卖点。

---

# 30. 用户系统

## 注册

支持：

- [x] Email 注册
- [x] Email 验证
- [x] 密码登录
- [x] 用户 / 管理员认证隔离
- [x] 忘记密码
- [x] 修改密码（管理员重置密码后首次登录强制修改）
- [ ] 注销账号
- [x] 登录状态保持
- [x] 退出登录

建议后期增加：

- [ ] Google 登录
- [ ] GitHub 登录

## 用户中心

- [x] 用户资料
- [x] 收藏工具
- [x] 最近使用
- [ ] 使用历史
- [ ] 我的设置
- [ ] 深色模式设置
- [ ] 账号安全
- [ ] 登录记录

---

# 31. 收藏功能

用户可以：

```text
收藏 JSON Formatter
收藏 Base64
收藏 Regex Tester
```

首页显示：

```text
我的常用工具
```

这会明显提高用户留存。

---

# 32. 最近使用

记录：

```text
JSON Formatter
10分钟前

Base64 Encoder
1小时前

Cron Generator
昨天
```

注意：

> 不建议默认保存用户实际输入的数据。

可以只保存：

```text
工具 ID
使用时间
```

而不是：

```text
用户输入的文本
```

除非用户主动开启历史保存。

---

# 33. 管理后台

管理后台建议单独设计。

## Dashboard

显示：

- [x] DAU
- [x] WAU
- [x] MAU
- [x] 注册用户
- [x] 活跃用户
- [x] 工具使用次数
- [x] 今日访问量
- [x] PV
- [x] UV
- [x] 热门工具
- [x] 错误率
- [x] API 请求量
- [x] 文件处理量

---

# 34. 工具管理

后台可以：

- [x] 新增工具
- [x] 编辑工具
- [x] 删除工具
- [x] 启用 / 禁用
- [x] 修改排序
- [x] 修改分类
- [x] 设置工具标题
- [x] 设置 Description
- [x] 设置 SEO Keywords
- [x] 设置使用限制
- [x] 设置是否需要登录
- [x] 设置是否允许免费使用
- [x] 设置推荐工具

尽量不要把工具页面配置全部硬编码。

---

# 35. 用户管理

- [x] 创建用户
- [x] 用户列表
- [x] 搜索用户
- [x] 查看用户
- [x] 禁用用户
- [x] 删除用户
- [x] 重置密码
- [x] 修改角色
- [x] 查看注册时间
- [x] 查看最后登录时间
- [x] 查看工具使用统计

角色：

```text
User
Admin
Super Admin
```

---

# 36. 系统设置

后台支持：

- [x] 网站名称
- [x] Logo
- [x] 网站 Description
- [x] Footer
- [x] ICP / 法律信息
- [x] 联系邮箱
- [x] 注册开关
- [x] 邮箱验证开关
- [x] 默认工具限制
- [x] 文件上传限制
- [x] API 限制
- [x] 广告开关
- [x] Maintenance Mode

---

# 37. SEO

这个项目非常适合 SEO。

每一个工具都应该拥有独立 URL。

例如：

```text
/tools/json-formatter
/tools/base64
/tools/url-encoder
/tools/regex-tester
/tools/curl-parser
/tools/cron-generator
/tools/color-converter
/tools/uuid-generator
```

每个工具页面都需要：

- [x] Title
- [x] Description
- [x] Canonical
- [x] Open Graph
- [x] Sitemap
- [x] robots.txt
- [x] Structured Data
- [x] 面包屑
- [x] FAQ
- [x] 工具说明
- [ ] 使用示例
- [x] Related Tools

---

# 38. 工具之间的关联推荐

例如：

```text
JSON Formatter
```

下面推荐：

```text
JSON Validator
JSON Minifier
JSON → YAML
JSON → CSV
JSON Diff
```

用户使用一个工具后，可以自然进入另一个工具。

这样可以增加：

```text
PV
Session Duration
工具使用次数
```

---

# 39. 搜索系统

网站顶部应该提供全局搜索。

例如输入：

```text
base
```

显示：

```text
Base64 Encoder
Base64 Decoder
Base64 Image
```

输入：

```text
json
```

显示：

```text
JSON Formatter
JSON Validator
JSON Diff
JSON → YAML
JSON → CSV
```

搜索支持：

- [x] 工具名称
- [x] 别名
- [x] 标签
- [x] 分类
- [x] Description

---

# 40. 性能要求

核心工具页面：

```text
首屏尽可能 < 2 秒
```

工具操作：

```text
本地工具尽可能即时响应
```

避免：

- [x] 大量 JS 首屏加载
- [x] 所有工具代码一次性加载
- [x] 不必要的第三方 SDK
- [x] 大型 UI 库全量加载

采用：

```text
工具按需加载
Code Splitting
Lazy Loading
```

---

# 41. 安全要求

这是整个项目非常重要的一部分。

## Web 安全

- [x] XSS 防护
- [x] CSRF 防护
- [x] SQL Injection 防护
- [x] SSRF 防护
- [ ] CORS 控制
- [x] CSP
- [x] Rate Limit
- [x] 登录暴力破解限制
- [x] 邮箱验证码限制
- [x] 文件上传安全检查
- [x] MIME 检查
- [x] 文件名过滤
- [x] 路径穿越防护

## 文件安全

禁止：

```text
../../etc/passwd
```

等路径穿越。

压缩包处理必须防止：

- [x] Zip Bomb
- [x] Zip Slip
- [x] 超大文件
- [x] 超深目录
- [x] 超多文件

---

# 42. API Rate Limit

统一设计：

```text
Anonymous:
100 requests / minute

User:
500 requests / minute

Premium:
根据套餐配置
```

具体数值不要写死，由后台配置。

不同接口设置不同限制。

例如：

```text
普通工具
较高限制

文件处理
较低限制

服务器网络请求
严格限制
```

---

# 43. 日志与监控

- [ ] Application Log
- [x] Error Log
- [x] Access Log
- [ ] Security Log
- [ ] Login Log（当前仅记录最后登录时间和失败尝试状态）
- [x] Admin Operation Log
- [ ] API Log
- [x] Tool Usage Log

管理员操作必须记录：

```text
谁
什么时候
做了什么
IP
结果
```

---

# 44. 数据统计

统计：

```text
工具使用次数
工具访问人数
工具使用趋势
```

例如：

```text
JSON Formatter
今日：12,532
昨日：11,829
增长：+5.9%
```

后台可以找出：

> 哪些工具值得继续投入。

---

# 45. 广告设计预留

虽然前期不建议急着加入大量广告，但 UI 从一开始就预留广告位置。

例如：

```text
首页顶部 Banner

工具页面右侧广告位

工具结果区域下方广告位

文章页面广告位
```

但必须注意：

> 广告不能破坏工具使用体验。

不要在用户点击“格式化”时弹窗广告。

---

# 46. 商业化设计

后期可以逐步增加：

## 免费

```text
普通工具
有限制
无需登录
```

## Pro

例如：

```text
更大输入
更大文件
批量处理
历史记录
API
去广告
高级工具
```

## API

例如：

```text
JSON API
Image API
QR API
Hash API
Format API
```

## 企业

提供：

- [ ] 更高 API 限额
- [ ] 私有部署
- [ ] 企业账号
- [ ] SLA
- [ ] API Key 管理

---

# 47. 敏感操作设计

对于：

- SSH 私钥
- JWT
- API Key
- Token
- Password
- Cookie

默认：

```text
Browser Local Processing
```

页面明显提示：

```text
Your data is processed locally
and is not uploaded to our servers.
```

这会比单纯说“安全”更加可信。

---

# 48. 测试

每个工具开发完成后必须包含：

> 当前已覆盖核心工具和主要业务流程，但尚未逐个工具完成以下全部输入场景。

- [ ] 正常输入测试（尚未覆盖全部工具）
- [ ] 空输入测试（尚未覆盖全部工具）
- [ ] 超长输入测试（尚未覆盖全部工具）
- [ ] 特殊字符测试（尚未覆盖全部工具）
- [ ] Unicode 测试（尚未覆盖全部工具）
- [ ] 超大文件测试
- [ ] 错误输入测试（尚未覆盖全部工具）
- [ ] 移动端测试（已有核心流程覆盖，尚未逐工具覆盖）
- [ ] 深色模式测试（已有核心流程覆盖，尚未逐工具覆盖）
- [ ] 浏览器兼容性测试

核心工具增加：

- [x] Unit Test（核心工具纯函数）
- [x] Integration Test（数据库、指标和用户管理）
- [x] E2E Test（中英文、桌面/移动端、认证和后台）

---

# 49. 敏捷开发流程

采用 Sprint。

建议每个 Sprint：

```text
1～2 周
```

流程：

```text
需求
 ↓
Product Backlog
 ↓
Sprint Planning
 ↓
开发
 ↓
Code Review
 ↓
测试
 ↓
部署
 ↓
数据观察
 ↓
下一 Sprint
```

---

# 50. 推荐 Sprint 路线

## Sprint 1

- [x] 项目初始化
- [x] UI 基础框架
- [x] 首页
- [x] 工具页面框架
- [x] 深色模式
- [x] 响应式设计

## Sprint 2

- [x] JSON Formatter
- [x] JSON Validator
- [x] Base64
- [x] URL Encoder
- [x] URL Decoder
- [x] Timestamp
- [x] UUID

## Sprint 3

- [x] 文本统计
- [x] 大小写转换
- [x] 文本 Diff
- [x] Regex Tester
- [x] 进制转换
- [x] Hash

## Sprint 4

- [x] Color Converter
- [x] QR Code
- [x] Curl Parser
- [x] Curl Generator
- [x] Cron Generator
- [x] JWT Decoder

## Sprint 5

- [x] 图片工具
- [x] ZIP 工具
- [x] 文件工具
- [x] SSH Key Generator
- [x] MIME Type
- [x] HTTP Status Code

## Sprint 6

- [x] Email 注册
- [x] 登录
- [x] 邮箱验证
- [x] 找回密码
- [x] 用户中心
- [x] 收藏

## Sprint 7

- [x] 管理后台
- [x] 用户管理
- [x] 工具管理
- [x] 系统设置
- [x] 使用统计
- [x] 操作日志

## Sprint 8

- [x] SEO
- [x] Sitemap
- [x] 搜索
- [x] Related Tools
- [x] FAQ
- [x] Analytics
- [x] 性能优化

## Sprint 9

持续增加工具：

- [x] SQL
- [x] Git
- [x] Docker
- [x] Linux
- [x] Nginx
- [x] CSS
- [x] HTML
- [x] JavaScript
- [x] 网络工具
- [x] API 工具

---

# 51. 工具开发统一规范

每一个工具都应该遵循统一的数据结构：

```text
Tool
├── id
├── slug
├── name
├── description
├── category
├── icon
├── keywords
├── component
├── requires_login
├── max_input_size
├── max_file_size
├── processing_mode
├── enabled
├── sort_order
├── seo_title
├── seo_description
└── created_at
```

其中：

```text
processing_mode
```

可以定义：

```text
client
server
hybrid
```

例如：

```text
JSON Formatter → client
Base64 → client
SSH Key → client
ZIP → client
Image Compress → client

某些需要服务器能力的工具 → server
```

---

# 52. 重要产品原则

### 原则一：工具优先

用户进入网站的目的不是看首页，而是：

> “我要马上解决一个开发问题。”

因此必须做到：

```text
搜索
→
工具
→
输入
→
结果
```

尽可能少的步骤。

### 原则二：不强制登录

绝大多数基础工具：

```text
打开即可使用
```

只有：

```text
收藏
历史
高级功能
API
会员
```

才要求登录。

### 原则三：隐私优先

可以在首页明确强调：

```text
Many tools run entirely in your browser.
Your data stays on your device.
```

### 原则四：工具小而专

不要一个页面塞几十个功能。

例如：

```text
JSON Formatter
```

就专注 JSON。

然后通过：

```text
Related Tools
```

连接其他工具。

### 原则五：统一体验

所有工具：

```text
输入
↓
操作
↓
输出
↓
复制 / 下载
```

尽量保持一致。

---

# 53. 第一版建议最终上线的工具

不要等待几十个工具全部开发完成。

第一版可以先上线：

1. [x] JSON Formatter
2. [x] JSON Validator
3. [x] JSON Minifier
4. [x] Base64 Encoder / Decoder
5. [x] URL Encoder / Decoder
6. [x] Timestamp Converter
7. [x] UUID Generator
8. [x] Hash Generator
9. [x] Text Counter
10. [x] Text Case Converter
11. [x] Text Diff
12. [x] Regex Tester
13. [x] Number Base Converter
14. [x] Color Converter
15. [x] QR Code Generator
16. [x] Curl Parser
17. [x] Curl Generator
18. [x] JWT Decoder
19. [x] Cron Generator
20. [x] HTML Formatter

达到这一步之后就可以开始真实收集用户数据，而不是继续无限增加功能。

---

# 54. 后续重点扩展方向

第一批用户数据出来之后，根据：

```text
访问量
使用次数
搜索词
跳出率
重复使用率
```

决定下一批工具。

例如发现：

```text
JSON Formatter
★★★★★

Base64
★★★★

Regex
★★★★★

Curl
★★★★★

SQL
★★★

Git
★★
```

那么下一阶段就应该继续加强：

```text
JSON
Regex
Curl
```

而不是平均分配开发资源。

---

# 55. MVP 完成标准

第一阶段不能以：

> “页面做出来了”

作为完成标准。

应该满足：

- [x] 用户可以正常访问
- [x] 手机可以使用
- [x] 工具可以正常工作
- [x] 输入限制正常
- [x] 错误处理正常
- [x] 深色模式正常
- [ ] 页面加载速度合理
- [x] SEO 基础完成
- [x] 无明显 XSS / SSRF / 文件上传漏洞
- [x] 工具可以被搜索引擎索引
- [x] Analytics 正常
- [x] 错误日志正常
- [x] 可以快速增加新工具
- [x] 后台可以控制工具状态
- [ ] Git + CI/CD 正常

---

# 56. 最终产品形态

长期目标不是单纯的：

```text
“几个在线小工具”
```

而应该逐渐形成：

```text
                Developer Toolbox
                       │
       ┌───────────────┼───────────────┐
       │               │               │
    Tools           Cheatsheets       API
       │               │               │
 JSON / Regex       Linux / Git      Developer API
 Curl / SQL         Docker / Nginx   Automation
 Image / File       Python / JS
       │
       └───────────────┐
                       │
                  User System
                       │
             ┌─────────┼─────────┐
             │         │         │
           收藏       历史       Pro
```

最终形成一个：

> **“程序员每天都可能打开一次的在线工具箱”**

而不是单纯靠某几个工具获取一次性流量的网站。

---

# 57. 开发优先级

最终按照以下优先级执行：

### P0 —— 必须完成

- [x] 基础框架
- [x] 首页
- [x] 工具页面
- [x] 搜索
- [x] JSON
- [x] Base64
- [x] URL
- [x] 文本
- [x] Regex
- [x] Diff
- [x] 时间戳
- [x] 进制
- [x] Color
- [x] Curl
- [x] QR
- [x] UUID
- [x] 深色模式
- [x] 响应式
- [x] 安全限制

### P1 —— 第一阶段完成

- [x] 注册登录
- [x] Email 验证
- [x] 收藏
- [x] 最近使用
- [x] 管理后台
- [x] 工具管理
- [x] 用户管理
- [x] 数据统计
- [x] SEO
- [x] Sitemap
- [x] Analytics

### P2 —— 用户增长后开发

- [x] ZIP
- [x] 图片
- [x] SSH
- [x] JWT
- [x] SQL
- [x] Git
- [x] Docker
- [x] Linux
- [x] Nginx
- [x] API Tester
- [ ] Webhook

### P3 —— 商业化

- [ ] Pro
- [ ] API Key
- [ ] API 套餐
- [ ] 去广告
- [ ] 更大文件
- [ ] 更高限制
- [ ] 批量处理
- [ ] 企业功能
- [ ] 私有部署
- [ ] 广告系统

---

# 58. AI 开发执行要求

如果使用 AI 编程助手进行开发，必须遵循：

1. 不要一次性生成整个项目。
2. 按 Sprint / Feature 开发。
3. 每完成一个 Feature 必须运行测试。
4. 不要为了实现一个简单工具引入大型依赖。
5. 优先使用成熟、维护良好的开源库。
6. 工具逻辑与 UI 分离。
7. 工具组件必须可以独立注册。
8. 所有限制参数集中配置。
9. 不允许把密钥、密码等敏感信息写入代码。
10. 不允许默认将用户工具输入上传服务器。
11. 所有服务端接口必须进行参数验证。
12. 所有文件处理必须设置大小和资源限制。
13. 所有需要服务器请求的功能必须考虑 SSRF。
14. 所有用户输入必须考虑 XSS。
15. 所有数据库查询必须使用参数化查询 / ORM。
16. 每完成一个 Sprint 创建 Git Tag。
17. 生产环境和开发环境配置分离。
18. 不允许为了“先跑起来”而关闭安全机制。
19. 新增工具必须遵循统一 Tool Interface。
20. 新工具必须自动生成 SEO 所需的基础元数据。

---

# 59. 第一阶段真正的目标

第一阶段不要追求：

> “工具越多越好。”

而应该追求：

> **建立一个可以持续增加工具的平台。**

理想情况下，以后增加一个工具只需要：

```text
创建 Tool Component
        ↓
注册 Tool Metadata
        ↓
设置 Category
        ↓
设置 Limit
        ↓
设置 SEO
        ↓
自动生成工具页面
```

而不是每增加一个工具都重新开发：

```text
路由
页面
SEO
菜单
权限
统计
后台
```

这样这个项目才真正具备长期扩展能力。
