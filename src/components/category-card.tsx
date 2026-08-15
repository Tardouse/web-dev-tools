import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolIcon } from "@/components/icon";
import { localePath, type Locale, type Messages } from "@/i18n";
import type { ToolCategory } from "@/lib/types";

export function CategoryCard({
  category,
  locale,
  messages,
  count,
}: {
  category: ToolCategory;
  locale: Locale;
  messages: Messages;
  count: number;
}) {
  return (
    <Link
      href={localePath(locale, `/categories/${category.id}`)}
      className="category-card card"
      style={{ "--category-color": category.color } as React.CSSProperties}
    >
      <span className="category-icon">
        <ToolIcon name={category.icon} size={22} />
      </span>
      <span className="category-copy">
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </span>
      <span className="category-count">
        {locale === "zh"
          ? `${count} 个工具`
          : `${count} ${count === 1 ? messages.common.tool : messages.common.tools.toLowerCase()}`}
      </span>
      <ArrowRight size={16} className="subtle" />
    </Link>
  );
}
