import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function LocaleNotFound() {
  return (
    <div className="container not-found">
      <div>
        <span className="eyebrow">页面不存在 · Page not found</span>
        <h1>404</h1>
        <p>
          未找到您访问的工具或页面。The requested tool or page was not found.
        </p>
        <div className="option-row" style={{ justifyContent: "center" }}>
          <Link className="button button-primary" href="/zh/tools">
            <Search size={16} />
            浏览工具
          </Link>
          <Link className="button" href="/zh">
            <Home size={16} />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
