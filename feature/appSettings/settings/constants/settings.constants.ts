import {
  AppearanceTextSizePreference,
  AppearanceThemePreference,
} from "@/feature/appSettings/appearance/types/appearance.types";
import {
  DataRightItem,
  HelpFaqItem,
  SupportContactItem,
  TermsDocumentItem,
} from "@/feature/appSettings/settings/types/settings.types";

export const SETTINGS_MIN_PASSWORD_LENGTH = 8;

export const SETTINGS_PERMISSION_LOADING_MESSAGE =
  "Checking your account access. Please try again in a moment.";
export const SETTINGS_OWNER_ADMIN_REQUIRED_MESSAGE =
  "Only the account owner or admin can change this setting.";

export const SETTINGS_BIOMETRIC_LOGIN_AVAILABLE = false;
export const SETTINGS_BIOMETRIC_COMING_SOON_MESSAGE = "Coming soon.";

export const SETTINGS_TWO_FACTOR_AUTH_AVAILABLE = false;
export const SETTINGS_TWO_FACTOR_COMING_SOON_MESSAGE = "Coming soon.";

export const SETTINGS_IMPORT_AVAILABLE = true;
export const SETTINGS_IMPORT_DISABLED_MESSAGE =
  "Only Products, Contacts, and Money Accounts are available for safe import in v1. Transactions, Orders, Ledger, EMI, and other relation-heavy modules remain protected until their full data-transfer workflows are ready.";

export const SETTINGS_SUPPORT_EMAIL = "support@e-lekha.com";

const buildSupportMailtoLink = (
  subject: string,
  body?: string,
): string => {
  const queryParts = [`subject=${encodeURIComponent(subject)}`];

  if (body) {
    queryParts.push(`body=${encodeURIComponent(body)}`);
  }

  return `mailto:${SETTINGS_SUPPORT_EMAIL}?${queryParts.join("&")}`;
};

export const SETTINGS_DEFAULT_APPEARANCE = {
  themePreference: AppearanceThemePreference.Light,
  textSizePreference: AppearanceTextSizePreference.Medium,
  compactModeEnabled: false,
  updatedAt: 0,
} as const;

export const SETTINGS_HELP_FAQ_ITEMS: readonly HelpFaqItem[] = [
  {
    id: "create-invoice",
    question: "How do I create an invoice?",
    answer:
      "Open Billing & Invoices from More, create a new billing document, review totals, then save before sharing or settling it.",
  },
  {
    id: "add-product",
    question: "How do I add a new product?",
    answer:
      "Open Products, tap Add Product, enter pricing and stock details, then save to make it available in Orders and POS.",
  },
  {
    id: "track-emi",
    question: "How do I track EMI payments?",
    answer:
      "Open EMI and Loans, select a plan, and record installment payments from the plan detail flow so balances stay accurate.",
  },
  {
    id: "export-data",
    question: "What does Export Data include?",
    answer:
      "Export Data only includes records from the account that is currently active in this session. Other accounts are excluded.",
  },
  {
    id: "switch-account",
    question: "How do I switch accounts?",
    answer:
      "Go to Profile, open your account list, and switch to another active workspace before working on that account's records.",
  },
] as const;

export const SETTINGS_SUPPORT_CONTACT_ITEMS: readonly SupportContactItem[] = [
  {
    id: "support-email",
    title: "Support Email",
    value: SETTINGS_SUPPORT_EMAIL,
    href: buildSupportMailtoLink("eLekha Support"),
    actionLabel: "Email support",
  },
  {
    id: "privacy-requests",
    title: "Privacy Requests",
    value: SETTINGS_SUPPORT_EMAIL,
    href: buildSupportMailtoLink(
      "eLekha Privacy Request",
      "Describe the account, request type, and the email address linked to your workspace.",
    ),
    actionLabel: "Contact privacy support",
  },
] as const;

export const SETTINGS_TERMS_DOCUMENT_ITEMS: readonly TermsDocumentItem[] = [
  {
    id: "terms-of-service",
    title: "Terms of Service",
    subtitle: "Request the current customer terms by email.",
    href: buildSupportMailtoLink("Request Terms of Service"),
    actionLabel: "Request copy",
  },
  {
    id: "privacy-policy",
    title: "Privacy Policy",
    subtitle: "Request the current privacy policy by email.",
    href: buildSupportMailtoLink("Request Privacy Policy"),
    actionLabel: "Request copy",
  },
  {
    id: "data-processing",
    title: "Data Processing & Retention",
    subtitle: "Ask support how workspace data is handled and retained.",
    href: buildSupportMailtoLink("Data Processing Request"),
    actionLabel: "Contact support",
  },
] as const;

export const SETTINGS_DATA_RIGHT_ITEMS: readonly DataRightItem[] = [
  {
    id: "access",
    label: "Request access to your data",
    description: "Ask support for a copy of the data tied to your current account.",
    href: buildSupportMailtoLink("Data Access Request"),
    actionLabel: "Email support",
  },
  {
    id: "correction",
    label: "Request a correction",
    description: "Report inaccurate profile or workspace information for review.",
    href: buildSupportMailtoLink("Data Correction Request"),
    actionLabel: "Email support",
  },
  {
    id: "deletion",
    label: "Request deletion",
    description: "Ask for account or workspace deletion support and confirm the exact scope of deletion.",
    href: buildSupportMailtoLink("Data Deletion Request"),
    actionLabel: "Email support",
  },
  {
    id: "consent",
    label: "Update consent preferences",
    description: "Contact support to update marketing or processing consent choices.",
    href: buildSupportMailtoLink("Consent Preferences Request"),
    actionLabel: "Email support",
  },
] as const;
