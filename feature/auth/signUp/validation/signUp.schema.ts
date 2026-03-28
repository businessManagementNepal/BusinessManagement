import { z } from "zod";
import { normalizePhoneNumber } from "@/shared/utils/auth/phoneNumber.util";
import { BUSINESS_TYPE_VALUES } from "@/shared/constants/businessType.constants";
import { SignUpProfileType } from "../types/signUp.types";
import {
  getInvalidSignUpPhoneMessageForCountry,
  isValidSignUpPhoneForCountry,
  sanitizeSignUpPhoneDigits,
} from "../utils/signUpPhoneNumber.util";

const fullNameSchema = z
  .string()
  .refine((value) => value.trim().length > 0, {
    message: "Full name is required.",
  })
  .refine((value) => value.trim().length >= 2, {
    message: "Full name must be at least 2 characters.",
  });

const passwordSchema = z
  .string()
  .refine((value) => value.trim().length > 0, {
    message: "Password is required.",
  })
  .refine((value) => value.trim().length >= 8, {
    message: "Password must be at least 8 characters.",
  });

const phoneCountryCodeSchema = z.enum(["NP", "IN"]);
const profileTypeSchema = z.enum([
  SignUpProfileType.Personal,
  SignUpProfileType.Business,
]);

const phoneNumberSchema = z.string();

const e164PhoneNumberSchema = z
  .string()
  .refine((value) => {
    const normalizedPhoneNumber = normalizePhoneNumber(value);
    return /^\+\d{8,15}$/.test(normalizedPhoneNumber);
  }, {
    message: "Invalid phone number format.",
  });

export const signUpFormSchema = z
  .object({
    fullName: fullNameSchema,
    phoneCountryCode: phoneCountryCodeSchema,
    profileType: profileTypeSchema,
    businessType: z.string(),
    phoneNumber: phoneNumberSchema,
    password: passwordSchema,
  })
  .superRefine((value, context) => {
    const phoneDigits = sanitizeSignUpPhoneDigits(value.phoneNumber);

    if (phoneDigits.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number is required.",
        path: ["phoneNumber"],
      });
      return;
    }

    if (!isValidSignUpPhoneForCountry(phoneDigits, value.phoneCountryCode)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: getInvalidSignUpPhoneMessageForCountry(value.phoneCountryCode),
        path: ["phoneNumber"],
      });
    }

    if (value.profileType === SignUpProfileType.Business) {
      if (!value.businessType.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business type is required.",
          path: ["businessType"],
        });
        return;
      }

      if (
        !BUSINESS_TYPE_VALUES.includes(
          value.businessType as (typeof BUSINESS_TYPE_VALUES)[number],
        )
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business type is invalid.",
          path: ["businessType"],
        });
      }
    }
  });

export const signUpInputSchema = z.object({
  fullName: fullNameSchema.transform((value) => value.trim()),
  phoneNumber: e164PhoneNumberSchema.transform(normalizePhoneNumber),
  password: passwordSchema.transform((value) => value.trim()),
  profileType: profileTypeSchema,
  businessType: z.enum(BUSINESS_TYPE_VALUES).nullable(),
}).superRefine((value, context) => {
  if (
    value.profileType === SignUpProfileType.Business &&
    value.businessType === null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Business type is required.",
      path: ["businessType"],
    });
  }

  if (
    value.profileType === SignUpProfileType.Personal &&
    value.businessType !== null
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Business type must not be set for personal profile.",
      path: ["businessType"],
    });
  }
});
