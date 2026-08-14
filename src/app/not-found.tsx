import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container not-found">
      <div>
        <span className="eyebrow">Page not found</span>
        <h1>404</h1>
        <p>
          The tool or page you requested may have moved, been disabled, or never
          existed.
        </p>
        <div className="option-row" style={{ justifyContent: "center" }}>
          <Link className="button button-primary" href="/tools">
            <Search size={16} />
            Browse tools
          </Link>
          <Link className="button" href="/">
            <Home size={16} />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
