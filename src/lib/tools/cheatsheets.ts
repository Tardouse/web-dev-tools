export type CheatsheetId = "linux" | "git" | "docker" | "nginx";

export interface CheatsheetEntry {
  group: string;
  command: string;
  description: string;
  descriptionZh: string;
}

export const cheatsheets: Record<CheatsheetId, CheatsheetEntry[]> = {
  linux: [
    { group: "Files", command: "find . -type f -name '*.log'", description: "Find files recursively", descriptionZh: "递归查找文件" },
    { group: "Files", command: "du -sh * | sort -h", description: "Sort entries by disk usage", descriptionZh: "按磁盘占用排序" },
    { group: "Text", command: "rg -n 'pattern' path", description: "Search text with line numbers", descriptionZh: "搜索文本并显示行号" },
    { group: "Processes", command: "ps aux --sort=-%mem | head", description: "Show highest-memory processes", descriptionZh: "查看内存占用最高的进程" },
    { group: "Network", command: "ss -tulpn", description: "List listening sockets", descriptionZh: "列出监听端口" },
    { group: "System", command: "journalctl -u service -f", description: "Follow a systemd service log", descriptionZh: "持续查看 systemd 服务日志" },
  ],
  git: [
    { group: "Inspect", command: "git status --short --branch", description: "Compact branch and worktree status", descriptionZh: "查看分支与工作树摘要" },
    { group: "Inspect", command: "git log --oneline --decorate --graph --all", description: "Visualize commit history", descriptionZh: "可视化提交历史" },
    { group: "Changes", command: "git diff --check", description: "Detect whitespace errors", descriptionZh: "检查空白字符错误" },
    { group: "Branches", command: "git switch -c feature/name", description: "Create and switch branch", descriptionZh: "创建并切换分支" },
    { group: "Recovery", command: "git reflog", description: "Find previous HEAD positions", descriptionZh: "查找历史 HEAD 位置" },
    { group: "Remote", command: "git fetch --all --prune", description: "Refresh and prune remote refs", descriptionZh: "刷新并清理远端引用" },
  ],
  docker: [
    { group: "Containers", command: "docker ps --all", description: "List running and stopped containers", descriptionZh: "列出运行中和已停止容器" },
    { group: "Containers", command: "docker logs --follow --tail 100 NAME", description: "Follow recent container logs", descriptionZh: "持续查看容器近期日志" },
    { group: "Images", command: "docker image ls", description: "List local images", descriptionZh: "列出本地镜像" },
    { group: "Build", command: "docker build --tag app:local .", description: "Build and tag an image", descriptionZh: "构建并标记镜像" },
    { group: "Compose", command: "docker compose up --detach --build", description: "Build and start a stack", descriptionZh: "构建并启动服务栈" },
    { group: "Inspect", command: "docker inspect NAME", description: "Show detailed object metadata", descriptionZh: "查看对象详细元数据" },
  ],
  nginx: [
    { group: "Validate", command: "nginx -t", description: "Validate configuration syntax", descriptionZh: "校验配置语法" },
    { group: "Reload", command: "nginx -s reload", description: "Reload configuration gracefully", descriptionZh: "平滑重载配置" },
    { group: "Proxy", command: "proxy_pass http://127.0.0.1:3000;", description: "Forward requests to an upstream", descriptionZh: "将请求转发到上游服务" },
    { group: "Headers", command: "proxy_set_header Host $host;", description: "Preserve the original host", descriptionZh: "保留原始 Host" },
    { group: "TLS", command: "listen 443 ssl http2;", description: "Listen with TLS and HTTP/2", descriptionZh: "启用 TLS 与 HTTP/2 监听" },
    { group: "Logs", command: "tail -f /var/log/nginx/error.log", description: "Follow the error log", descriptionZh: "持续查看错误日志" },
  ],
};

export function searchCheatsheet(id: CheatsheetId, query: string): CheatsheetEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return cheatsheets[id];
  return cheatsheets[id].filter((entry) =>
    `${entry.group} ${entry.command} ${entry.description} ${entry.descriptionZh}`
      .toLowerCase()
      .includes(normalized),
  );
}
