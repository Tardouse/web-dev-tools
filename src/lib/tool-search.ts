import type { ToolCategory, ToolDefinition } from "@/lib/types";

function searchScore(
  tool: ToolDefinition,
  query: string,
  categoryName: string,
): number {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const title = `${tool.name} ${tool.shortName} ${(tool.aliases ?? []).join(" ")}`.toLowerCase();
  const rest = `${tool.description} ${tool.keywords.join(" ")} ${categoryName}`.toLowerCase();
  return terms.reduce(
    (total, term) =>
      total +
      (title.startsWith(term)
        ? 8
        : title.includes(term)
          ? 5
          : rest.includes(term)
            ? 2
            : 0),
    0,
  );
}

export function searchToolDefinitions(
  tools: ToolDefinition[],
  categories: ToolCategory[],
  query: string,
): ToolDefinition[] {
  const names = new Map(
    categories.map((category) => [category.id, category.name.toLowerCase()]),
  );
  return tools
    .map((tool) => ({
      tool,
      score: searchScore(tool, query, names.get(tool.category) ?? ""),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.tool.sortOrder - right.tool.sortOrder,
    )
    .map(({ tool }) => tool);
}
