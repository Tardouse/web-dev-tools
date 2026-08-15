import type { ToolCategoryId } from "@/lib/types";

export interface ManagedToolConfiguration {
  slug: string;
  implementation: string;
  source: "core" | "custom";
  nameEn: string;
  nameZh: string;
  shortNameEn: string;
  shortNameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  category: ToolCategoryId;
  keywordsEn: string[];
  keywordsZh: string[];
  seoTitleEn: string;
  seoTitleZh: string;
  seoDescriptionEn: string;
  seoDescriptionZh: string;
  maxInputSize: number;
  requiresLogin: boolean;
  freeToUse: boolean;
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
  customized: boolean;
}

export interface ToolConfigurationInput {
  slug: string;
  implementation: string;
  nameEn: string;
  nameZh: string;
  shortNameEn: string;
  shortNameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  category: ToolCategoryId;
  keywordsEn: string[];
  keywordsZh: string[];
  seoTitleEn: string;
  seoTitleZh: string;
  seoDescriptionEn: string;
  seoDescriptionZh: string;
  maxInputSize: number;
  requiresLogin: boolean;
  freeToUse: boolean;
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
}
