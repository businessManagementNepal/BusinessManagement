export const BUSINESS_TYPE_VALUES = [
  "Retail Store",
  "Wholesale Business",
  "Restaurant / Cafe",
  "Grocery / Kirana",
  "Pharmacy / Medical Store",
  "Clothing / Fashion",
  "Electronics / Mobile Shop",
  "Hardware / Construction Supply",
  "Beauty Salon / Cosmetics",
  "Service Business",
  "Education / Training Center",
  "Health / Clinic",
  "Manufacturing / Production",
  "Agriculture / Livestock",
  "Travel / Tourism",
  "E-commerce / Online Store",
  "Logistics / Delivery",
  "Freelancer / Professional",
  "NGO / Nonprofit",
  "Other",
] as const;

export type BusinessTypeValue = (typeof BUSINESS_TYPE_VALUES)[number];

export type BusinessTypeOption = {
  value: BusinessTypeValue;
  label: BusinessTypeValue;
};

export const BUSINESS_TYPE_OPTIONS: readonly BusinessTypeOption[] =
  BUSINESS_TYPE_VALUES.map((value) => ({
    value,
    label: value,
  }));
