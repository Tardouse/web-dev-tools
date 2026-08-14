export type ToolCategoryId =
  | "json-data"
  | "encoding"
  | "time-number"
  | "text"
  | "regex"
  | "crypto"
  | "web";

export type ProcessingMode = "client" | "server" | "hybrid";

export interface ToolDefinition {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: ToolCategoryId;
  icon: string;
  keywords: string[];
  aliases?: string[];
  requiresLogin: boolean;
  maxInputSize: number;
  processingMode: ProcessingMode;
  enabled: boolean;
  sortOrder: number;
  featured?: boolean;
  seoTitle: string;
  seoDescription: string;
  related: string[];
  faq: Array<{ question: string; answer: string }>;
}

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  description: string;
  icon: string;
  color: string;
}

import type { Locale, Messages } from "@/i18n";

export interface ToolComponentProps {
  definition?: ToolDefinition;
  locale: Locale;
  messages: Messages;
}
