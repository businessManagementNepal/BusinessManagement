import {
  ContactBalanceDirection,
  ContactType,
  ContactTypeValue,
} from "@/feature/contacts/types/contact.types";
import { AccountType, AccountTypeValue } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
  ImportPreviewRowStatus,
  ImportRowPreview,
} from "@/feature/appSettings/dataTransfer/types/dataTransfer.types";
import { normalizePhoneForIdentity } from "@/feature/contacts/shared/contactPhoneIdentity.shared";
import { getNumberValue, getTextValue } from "../parser/importParser.shared";

const DEFAULT_CONTACT_TYPE_BY_ACCOUNT: Record<AccountTypeValue, ContactTypeValue> = {
  [AccountType.Business]: ContactType.Customer,
  [AccountType.Personal]: ContactType.Friend,
};

const CONTACT_TYPE_SET = new Set(Object.values(ContactType));

type ContactValidationContext = {
  activeAccountType: AccountTypeValue;
  existingPhoneValues: Set<string>;
  existingEmailValues: Set<string>;
  seenPhoneValues: Set<string>;
  seenEmailValues: Set<string>;
};

const normalizeEmail = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase();
};

export const validateContactImportRow = (
  rowNumber: number,
  row: Record<string, unknown>,
  context: ContactValidationContext,
): ImportRowPreview => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fullName = getTextValue(row, ["name", "full_name", "contact_name"]);
  const phoneNumber = getTextValue(row, ["phone", "phone_number", "mobile"]);
  const emailAddress = normalizeEmail(
    getTextValue(row, ["email", "email_address"]),
  );
  const address = getTextValue(row, ["address"]);
  const taxId = getTextValue(row, ["tax_id", "vat_no", "pan_no"]);
  const notes = getTextValue(row, ["notes", "description"]);
  const openingBalanceAmount =
    getNumberValue(row, [
      "opening_balance",
      "opening_balance_amount",
      "balance",
    ]) ?? 0;
  const directionValue = getTextValue(row, [
    "opening_balance_direction",
    "balance_direction",
  ]);
  const normalizedDirection =
    directionValue?.toLowerCase() === ContactBalanceDirection.Receive
      ? ContactBalanceDirection.Receive
      : directionValue?.toLowerCase() === ContactBalanceDirection.Pay
        ? ContactBalanceDirection.Pay
        : null;
  const typeValue =
    getTextValue(row, ["contact_type", "type"])?.toLowerCase() ?? null;
  const contactType = typeValue && CONTACT_TYPE_SET.has(typeValue as ContactTypeValue)
    ? (typeValue as ContactTypeValue)
    : DEFAULT_CONTACT_TYPE_BY_ACCOUNT[context.activeAccountType];

  if (!fullName) {
    errors.push("Contact name is required.");
  }

  if (!phoneNumber) {
    errors.push("Phone number is required for contact import.");
  }

  if (openingBalanceAmount < 0) {
    errors.push("Opening balance cannot be negative.");
  }

  if (openingBalanceAmount === 0 && normalizedDirection !== null) {
    errors.push(
      "Opening balance direction must be empty when opening balance is zero.",
    );
  }

  if (openingBalanceAmount > 0 && normalizedDirection === null) {
    errors.push(
      "Opening balance direction is required when opening balance is greater than zero.",
    );
  }

  if (typeValue !== null && !CONTACT_TYPE_SET.has(typeValue as ContactTypeValue)) {
    errors.push("Contact type is invalid.");
  } else if (typeValue === null) {
    warnings.push(
      `Contact type was not provided. Defaulted to ${contactType.replace(/_/g, " ")}.`,
    );
  }

  const normalizedPhone = normalizePhoneForIdentity(phoneNumber);
  if (normalizedPhone) {
    if (context.existingPhoneValues.has(normalizedPhone)) {
      errors.push("Phone number already exists in this account.");
    }

    if (context.seenPhoneValues.has(normalizedPhone)) {
      errors.push("Phone number is duplicated in this import file.");
    }
  }

  if (emailAddress) {
    if (context.existingEmailValues.has(emailAddress)) {
      errors.push("Email address already exists in this account.");
    }

    if (context.seenEmailValues.has(emailAddress)) {
      errors.push("Email address is duplicated in this import file.");
    }
  }

  if (errors.length === 0) {
    if (normalizedPhone) {
      context.seenPhoneValues.add(normalizedPhone);
    }

    if (emailAddress) {
      context.seenEmailValues.add(emailAddress);
    }
  }

  const normalizedData = {
    fullName: fullName ?? "",
    accountType: context.activeAccountType,
    phoneNumber: phoneNumber ?? null,
    emailAddress,
    address,
    taxId,
    openingBalanceAmount,
    openingBalanceDirection: normalizedDirection,
    notes,
    contactType,
    isArchived: false,
  };

  const status =
    errors.some((message) => message.toLowerCase().includes("exists") || message.toLowerCase().includes("duplicated"))
      ? ImportPreviewRowStatus.Duplicate
      : errors.length > 0
        ? ImportPreviewRowStatus.Invalid
        : warnings.length > 0
          ? ImportPreviewRowStatus.Warning
          : ImportPreviewRowStatus.Valid;

  return {
    rowNumber,
    status,
    errors,
    warnings,
    normalizedData,
  };
};
