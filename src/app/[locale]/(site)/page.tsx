import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";
import { CategoryCard } from "@/components/category-card";
import { HeroSearch } from "@/components/hero-search";
import { RecentTools } from "@/components/recent-tools";
import { ToolCard } from "@/components/tool-card";
import { getMessages, interpolate, isLocale, localePath } from "@/i18n";
import {
  getPublicCategories,
  getPublicTools,
} from "@/server/db/tool-management";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const [tools, categories] = await Promise.all([
    getPublicTools(locale),
    getPublicCategories(locale),
  ]);
  const featured = tools.filter((tool) => tool.featured).slice(0, 8);
  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <span className="eyebrow">{messages.home.eyebrow}</span>
          <h1>{messages.home.title}</h1>
          <p className="hero-copy">{messages.home.description}</p>
          <HeroSearch
            locale={locale}
            messages={messages}
            tools={tools}
            categories={categories}
          />
          <div className="hero-points">
            <span className="hero-point">
              <CheckCircle2 size={15} />
              {messages.home.noAccount}
            </span>
            <span className="hero-point">
              <Zap size={15} />
              {messages.home.instant}
            </span>
            <span className="hero-point">
              <LockKeyhole size={15} />
              {messages.home.dataLocal}
            </span>
          </div>
        </div>
      </section>
      <div className="container">
        <RecentTools locale={locale} messages={messages} tools={tools} />
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{messages.home.popularEyebrow}</span>
              <h2>{messages.home.popularTitle}</h2>
              <p>{messages.home.popularDescription}</p>
            </div>
            <Link className="section-link" href={localePath(locale, "/tools")}>
              {interpolate(messages.home.viewAll, { count: tools.length })}{" "}
              <ArrowRight size={15} style={{ verticalAlign: "-2px" }} />
            </Link>
          </div>
          <div className="tool-grid">
            {featured.map((tool) => (
              <ToolCard
                tool={tool}
                locale={locale}
                messages={messages}
                key={tool.id}
              />
            ))}
          </div>
        </section>
        <section className="section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{messages.home.categoriesEyebrow}</span>
              <h2>{messages.home.categoriesTitle}</h2>
              <p>{messages.home.categoriesDescription}</p>
            </div>
            <Link
              className="section-link"
              href={localePath(locale, "/categories")}
            >
              {messages.home.allCategories}{" "}
              <ArrowRight size={15} style={{ verticalAlign: "-2px" }} />
            </Link>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <CategoryCard
                category={category}
                locale={locale}
                messages={messages}
                count={tools.filter((tool) => tool.category === category.id).length}
                key={category.id}
              />
            ))}
          </div>
        </section>
        <section className="section">
          <div className="privacy-callout card">
            <ShieldCheck size={38} />
            <div>
              <h2>{messages.home.privacyTitle}</h2>
              <p>{messages.home.privacyDescription}</p>
            </div>
            <Link className="button" href={localePath(locale, "/tools")}>
              <Search size={16} />
              {messages.home.explore}
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
