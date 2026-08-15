export interface SiteSettings {
  siteName: string;
  logoText: string;
  logoUrl: string;
  descriptionEn: string;
  descriptionZh: string;
  footerEn: string;
  footerZh: string;
  legalText: string;
  contactEmail: string;
  registrationEnabled: boolean;
  emailVerificationEnabled: boolean;
  defaultToolLimit: number;
  fileUploadLimit: number;
  anonymousApiLimit: number;
  userApiLimit: number;
  adsEnabled: boolean;
  maintenanceMode: boolean;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "DevToolbox",
  logoText: "</>",
  logoUrl: "",
  descriptionEn:
    "Fast, private developer utilities for formatting, encoding, testing, and everyday engineering work.",
  descriptionZh: "打开即用、快速且隐私优先的在线开发工具箱。",
  footerEn: "Fast, private utilities for everyday development work.",
  footerZh: "快速、隐私优先的日常开发工具。",
  legalText: "",
  contactEmail: "",
  registrationEnabled: true,
  emailVerificationEnabled: true,
  defaultToolLimit: 1024 * 1024,
  fileUploadLimit: 50 * 1024 * 1024,
  anonymousApiLimit: 100,
  userApiLimit: 500,
  adsEnabled: false,
  maintenanceMode: false,
};
