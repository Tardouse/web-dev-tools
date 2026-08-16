export type CheatsheetId =
  | "linux"
  | "git"
  | "docker"
  | "nginx"
  | "vim"
  | "regex"
  | "bash"
  | "sql"
  | "javascript"
  | "python"
  | "http-status-code"
  | "css";

export interface CheatsheetEntry {
  group: string;
  command: string;
  description: string;
  descriptionZh: string;
}

export const cheatsheets: Record<CheatsheetId, CheatsheetEntry[]> = {
  linux: [
    {
      group: "Files",
      command: "find . -type f -name '*.log'",
      description: "Find files recursively",
      descriptionZh: "递归查找文件",
    },
    {
      group: "Files",
      command: "du -sh * | sort -h",
      description: "Sort entries by disk usage",
      descriptionZh: "按磁盘占用排序",
    },
    {
      group: "Text",
      command: "rg -n 'pattern' path",
      description: "Search text with line numbers",
      descriptionZh: "搜索文本并显示行号",
    },
    {
      group: "Processes",
      command: "ps aux --sort=-%mem | head",
      description: "Show highest-memory processes",
      descriptionZh: "查看内存占用最高的进程",
    },
    {
      group: "Network",
      command: "ss -tulpn",
      description: "List listening sockets",
      descriptionZh: "列出监听端口",
    },
    {
      group: "System",
      command: "journalctl -u service -f",
      description: "Follow a systemd service log",
      descriptionZh: "持续查看 systemd 服务日志",
    },
  ],
  git: [
    {
      group: "Inspect",
      command: "git status --short --branch",
      description: "Compact branch and worktree status",
      descriptionZh: "查看分支与工作树摘要",
    },
    {
      group: "Inspect",
      command: "git log --oneline --decorate --graph --all",
      description: "Visualize commit history",
      descriptionZh: "可视化提交历史",
    },
    {
      group: "Changes",
      command: "git diff --check",
      description: "Detect whitespace errors",
      descriptionZh: "检查空白字符错误",
    },
    {
      group: "Branches",
      command: "git switch -c feature/name",
      description: "Create and switch branch",
      descriptionZh: "创建并切换分支",
    },
    {
      group: "Recovery",
      command: "git reflog",
      description: "Find previous HEAD positions",
      descriptionZh: "查找历史 HEAD 位置",
    },
    {
      group: "Remote",
      command: "git fetch --all --prune",
      description: "Refresh and prune remote refs",
      descriptionZh: "刷新并清理远端引用",
    },
  ],
  docker: [
    {
      group: "Containers",
      command: "docker ps --all",
      description: "List running and stopped containers",
      descriptionZh: "列出运行中和已停止容器",
    },
    {
      group: "Containers",
      command: "docker logs --follow --tail 100 NAME",
      description: "Follow recent container logs",
      descriptionZh: "持续查看容器近期日志",
    },
    {
      group: "Images",
      command: "docker image ls",
      description: "List local images",
      descriptionZh: "列出本地镜像",
    },
    {
      group: "Build",
      command: "docker build --tag app:local .",
      description: "Build and tag an image",
      descriptionZh: "构建并标记镜像",
    },
    {
      group: "Compose",
      command: "docker compose up --detach --build",
      description: "Build and start a stack",
      descriptionZh: "构建并启动服务栈",
    },
    {
      group: "Inspect",
      command: "docker inspect NAME",
      description: "Show detailed object metadata",
      descriptionZh: "查看对象详细元数据",
    },
  ],
  nginx: [
    {
      group: "Validate",
      command: "nginx -t",
      description: "Validate configuration syntax",
      descriptionZh: "校验配置语法",
    },
    {
      group: "Reload",
      command: "nginx -s reload",
      description: "Reload configuration gracefully",
      descriptionZh: "平滑重载配置",
    },
    {
      group: "Proxy",
      command: "proxy_pass http://127.0.0.1:3000;",
      description: "Forward requests to an upstream",
      descriptionZh: "将请求转发到上游服务",
    },
    {
      group: "Headers",
      command: "proxy_set_header Host $host;",
      description: "Preserve the original host",
      descriptionZh: "保留原始 Host",
    },
    {
      group: "TLS",
      command: "listen 443 ssl http2;",
      description: "Listen with TLS and HTTP/2",
      descriptionZh: "启用 TLS 与 HTTP/2 监听",
    },
    {
      group: "Logs",
      command: "tail -f /var/log/nginx/error.log",
      description: "Follow the error log",
      descriptionZh: "持续查看错误日志",
    },
  ],
  vim: [
    {
      group: "Navigation",
      command: "gg / G",
      description: "Jump to the first or last line",
      descriptionZh: "跳到首行或末行",
    },
    {
      group: "Navigation",
      command: "0 / $",
      description: "Jump to the start or end of a line",
      descriptionZh: "跳到行首或行尾",
    },
    {
      group: "Editing",
      command: "i / a / o",
      description: "Insert before, append after, or open a new line",
      descriptionZh: "在光标前插入、光标后追加或新建一行",
    },
    {
      group: "Editing",
      command: "dd / yy / p",
      description: "Delete, copy, and paste a line",
      descriptionZh: "删除、复制和粘贴一行",
    },
    {
      group: "History",
      command: "u / Ctrl-r",
      description: "Undo or redo the latest change",
      descriptionZh: "撤销或重做最近的修改",
    },
    {
      group: "Search",
      command: "/pattern / n / N",
      description: "Search and move between matches",
      descriptionZh: "搜索并在匹配项之间移动",
    },
    {
      group: "Replace",
      command: ":%s/old/new/gc",
      description: "Replace across the file with confirmation",
      descriptionZh: "在整个文件中逐项确认替换",
    },
    {
      group: "Files",
      command: ":w / :q / :q!",
      description: "Save, quit, or quit without saving",
      descriptionZh: "保存、退出或不保存强制退出",
    },
  ],
  regex: [
    {
      group: "Anchors",
      command: "^start.*end$",
      description: "Match from the start through the end of a string",
      descriptionZh: "从字符串开头匹配到结尾",
    },
    {
      group: "Characters",
      command: "\\d+ / \\w+ / \\s+",
      description: "Match digits, word characters, or whitespace",
      descriptionZh: "匹配数字、单词字符或空白",
    },
    {
      group: "Classes",
      command: "[A-Za-z0-9_]+",
      description: "Match one or more allowed characters",
      descriptionZh: "匹配一个或多个指定字符",
    },
    {
      group: "Groups",
      command: "(?:pattern)",
      description: "Group without creating a capture",
      descriptionZh: "分组但不创建捕获结果",
    },
    {
      group: "Groups",
      command: "(?<name>pattern)",
      description: "Create a named capture group",
      descriptionZh: "创建命名捕获组",
    },
    {
      group: "Lookaround",
      command: "foo(?=bar)",
      description: "Require a following value without consuming it",
      descriptionZh: "要求后续值存在但不消耗它",
    },
    {
      group: "Boundaries",
      command: "\\bword\\b",
      description: "Match a complete word at word boundaries",
      descriptionZh: "在单词边界匹配完整单词",
    },
    {
      group: "Quantifiers",
      command: ".*?",
      description: "Match as little text as possible",
      descriptionZh: "使用非贪婪方式匹配尽可能少的文本",
    },
  ],
  bash: [
    {
      group: "Safety",
      command: "set -euo pipefail",
      description: "Exit on errors, unset variables, and failed pipelines",
      descriptionZh: "在错误、未定义变量或管道失败时退出",
    },
    {
      group: "Tests",
      command: '[[ -f "$file" ]]',
      description: "Check whether a regular file exists",
      descriptionZh: "检查普通文件是否存在",
    },
    {
      group: "Arguments",
      command: "name=$1",
      description: "Read the first positional argument",
      descriptionZh: "读取第一个位置参数",
    },
    {
      group: "Loops",
      command: 'for item in "$@"; do echo "$item"; done',
      description: "Iterate over all positional arguments safely",
      descriptionZh: "安全遍历所有位置参数",
    },
    {
      group: "Input",
      command: "IFS= read -r line",
      description: "Read one line without backslash processing",
      descriptionZh: "读取一行且不处理反斜杠",
    },
    {
      group: "Cleanup",
      command: "trap cleanup EXIT INT TERM",
      description: "Run cleanup when the script exits or is interrupted",
      descriptionZh: "脚本退出或中断时执行清理",
    },
    {
      group: "Commands",
      command: "command -v tool >/dev/null 2>&1",
      description: "Check whether a command is available",
      descriptionZh: "检查命令是否可用",
    },
    {
      group: "Cases",
      command: 'case "$value" in start) run ;; *) usage ;; esac',
      description: "Branch on exact or wildcard values",
      descriptionZh: "按精确值或通配符进行分支",
    },
  ],
  sql: [
    {
      group: "Query",
      command: "SELECT id, name FROM users WHERE active = TRUE;",
      description: "Select specific columns with a filter",
      descriptionZh: "按条件查询指定列",
    },
    {
      group: "Join",
      command:
        "SELECT u.id, o.total FROM users u JOIN orders o ON o.user_id = u.id;",
      description: "Combine related rows with an inner join",
      descriptionZh: "使用内连接组合关联行",
    },
    {
      group: "Aggregate",
      command: "SELECT status, COUNT(*) FROM jobs GROUP BY status;",
      description: "Count rows by a grouping key",
      descriptionZh: "按分组字段统计行数",
    },
    {
      group: "Insert",
      command:
        "INSERT INTO users (name, email) VALUES ('Ada', 'ada@example.com');",
      description: "Insert a row with explicit columns",
      descriptionZh: "按明确列插入一行",
    },
    {
      group: "Update",
      command: "UPDATE users SET active = FALSE WHERE id = 42;",
      description: "Update only rows matching a predicate",
      descriptionZh: "仅更新符合条件的行",
    },
    {
      group: "Transaction",
      command:
        "BEGIN; UPDATE accounts SET balance = balance - 10 WHERE id = 1; COMMIT;",
      description: "Apply related changes atomically",
      descriptionZh: "以事务原子执行相关修改",
    },
    {
      group: "CTE",
      command:
        "WITH recent AS (SELECT * FROM events ORDER BY created_at DESC LIMIT 10) SELECT * FROM recent;",
      description: "Name and reuse an intermediate result",
      descriptionZh: "命名并复用中间查询结果",
    },
    {
      group: "Inspect",
      command: "EXPLAIN SELECT * FROM users WHERE email = 'ada@example.com';",
      description: "Inspect a query execution plan",
      descriptionZh: "检查查询执行计划",
    },
  ],
  javascript: [
    {
      group: "Objects",
      command: "const { id, name } = user;",
      description: "Extract object properties with destructuring",
      descriptionZh: "使用解构提取对象属性",
    },
    {
      group: "Defaults",
      command: "const label = value ?? 'Unknown';",
      description: "Fallback only for null or undefined",
      descriptionZh: "仅在 null 或 undefined 时使用默认值",
    },
    {
      group: "Access",
      command: "const city = user.address?.city;",
      description: "Read a nested property safely",
      descriptionZh: "安全读取嵌套属性",
    },
    {
      group: "Arrays",
      command: "const ids = items.filter(Boolean).map((item) => item.id);",
      description: "Filter and transform an array",
      descriptionZh: "过滤并转换数组",
    },
    {
      group: "Async",
      command: "const results = await Promise.all(tasks.map(run));",
      description: "Wait for independent asynchronous work in parallel",
      descriptionZh: "并行等待多个独立异步任务",
    },
    {
      group: "Collections",
      command: "const unique = [...new Set(values)];",
      description: "Remove duplicate primitive values",
      descriptionZh: "移除基本类型数组中的重复值",
    },
    {
      group: "Modules",
      command: "export { parse }; import { parse } from './parser.js';",
      description: "Export and import a named binding",
      descriptionZh: "导出并导入命名绑定",
    },
    {
      group: "JSON",
      command: "const clone = JSON.parse(JSON.stringify(value));",
      description: "Clone JSON-compatible data",
      descriptionZh: "克隆可 JSON 序列化的数据",
    },
  ],
  python: [
    {
      group: "Environment",
      command: "python -m venv .venv && source .venv/bin/activate",
      description: "Create and activate a virtual environment",
      descriptionZh: "创建并激活虚拟环境",
    },
    {
      group: "Packages",
      command: "python -m pip install -r requirements.txt",
      description: "Install locked project dependencies",
      descriptionZh: "安装项目依赖清单",
    },
    {
      group: "Comprehension",
      command: "squares = [value * value for value in values if value > 0]",
      description: "Filter and transform a sequence",
      descriptionZh: "过滤并转换序列",
    },
    {
      group: "Iteration",
      command: "for index, value in enumerate(values, start=1):",
      description: "Iterate with a one-based index",
      descriptionZh: "使用从一开始的索引迭代",
    },
    {
      group: "Files",
      command: "text = Path('data.txt').read_text(encoding='utf-8')",
      description: "Read UTF-8 text with pathlib",
      descriptionZh: "使用 pathlib 读取 UTF-8 文本",
    },
    {
      group: "Resources",
      command: "with open('data.json', encoding='utf-8') as handle:",
      description: "Close a file automatically after use",
      descriptionZh: "使用后自动关闭文件",
    },
    {
      group: "JSON",
      command:
        "payload = json.loads(text); output = json.dumps(payload, indent=2)",
      description: "Parse and format JSON data",
      descriptionZh: "解析并格式化 JSON 数据",
    },
    {
      group: "Errors",
      command: "try: run()\nexcept ValueError as error: print(error)",
      description: "Handle a specific expected exception",
      descriptionZh: "处理明确预期的异常",
    },
  ],
  "http-status-code": [
    {
      group: "Success",
      command: "200 OK",
      description: "The request succeeded and returns a representation",
      descriptionZh: "请求成功并返回资源表示",
    },
    {
      group: "Success",
      command: "201 Created",
      description: "A new resource was created successfully",
      descriptionZh: "已成功创建新资源",
    },
    {
      group: "Success",
      command: "204 No Content",
      description: "The request succeeded without a response body",
      descriptionZh: "请求成功但不返回响应正文",
    },
    {
      group: "Redirect",
      command: "301 Moved Permanently",
      description: "The resource has a permanent canonical location",
      descriptionZh: "资源已永久移动到新的规范地址",
    },
    {
      group: "Redirect",
      command: "304 Not Modified",
      description: "Use the cached representation",
      descriptionZh: "资源未变化，可使用缓存版本",
    },
    {
      group: "Client Error",
      command: "400 Bad Request",
      description: "The request syntax or input is invalid",
      descriptionZh: "请求语法或输入无效",
    },
    {
      group: "Client Error",
      command: "401 Unauthorized",
      description: "Authentication credentials are missing or invalid",
      descriptionZh: "缺少认证凭据或凭据无效",
    },
    {
      group: "Client Error",
      command: "403 Forbidden",
      description: "The identity is known but lacks permission",
      descriptionZh: "身份已知但没有访问权限",
    },
    {
      group: "Client Error",
      command: "404 Not Found",
      description: "The requested resource does not exist",
      descriptionZh: "请求的资源不存在",
    },
    {
      group: "Client Error",
      command: "409 Conflict",
      description: "The request conflicts with current resource state",
      descriptionZh: "请求与资源当前状态冲突",
    },
    {
      group: "Client Error",
      command: "422 Unprocessable Content",
      description: "Syntax is valid but semantic validation failed",
      descriptionZh: "语法有效但语义校验失败",
    },
    {
      group: "Client Error",
      command: "429 Too Many Requests",
      description: "The client exceeded a rate limit",
      descriptionZh: "客户端超过速率限制",
    },
    {
      group: "Server Error",
      command: "500 Internal Server Error",
      description: "The server encountered an unexpected failure",
      descriptionZh: "服务器遇到未预期故障",
    },
    {
      group: "Server Error",
      command: "503 Service Unavailable",
      description: "The service is temporarily unable to handle requests",
      descriptionZh: "服务暂时无法处理请求",
    },
  ],
  css: [
    {
      group: "Sizing",
      command: "*, *::before, *::after { box-sizing: border-box; }",
      description: "Include borders and padding in element dimensions",
      descriptionZh: "将边框和内边距计入元素尺寸",
    },
    {
      group: "Flexbox",
      command:
        ".center { display: flex; align-items: center; justify-content: center; }",
      description: "Center content on both axes",
      descriptionZh: "在两个轴向居中内容",
    },
    {
      group: "Grid",
      command:
        ".grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }",
      description: "Build a responsive card grid",
      descriptionZh: "构建响应式网格布局",
    },
    {
      group: "Type",
      command: "font-size: clamp(1rem, 2vw, 1.5rem);",
      description: "Constrain responsive typography",
      descriptionZh: "限制响应式字号范围",
    },
    {
      group: "Variables",
      command: ":root { --accent: #2563eb; }",
      description: "Define a reusable custom property",
      descriptionZh: "定义可复用的自定义属性",
    },
    {
      group: "Media",
      command: "@media (max-width: 48rem) { .sidebar { display: none; } }",
      description: "Apply styles below a viewport breakpoint",
      descriptionZh: "在视口断点以下应用样式",
    },
    {
      group: "Media",
      command: ".preview { aspect-ratio: 16 / 9; object-fit: cover; }",
      description: "Keep media in a stable frame",
      descriptionZh: "让媒体保持稳定比例和裁切",
    },
    {
      group: "Overflow",
      command:
        ".truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }",
      description: "Truncate a single line with an ellipsis",
      descriptionZh: "用省略号截断单行文本",
    },
  ],
};

export function searchCheatsheet(
  id: CheatsheetId,
  query: string,
): CheatsheetEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cheatsheets[id];
  return cheatsheets[id].filter((entry) =>
    `${entry.group} ${entry.command} ${entry.description} ${entry.descriptionZh}`
      .toLowerCase()
      .includes(normalized),
  );
}
