import { z } from "zod";
import { normalizePhoneNumber } from "@/shared/utils/auth/phoneNumber.util";
import { sanitizeSignUpPhoneDigits } from "../utils/signUpPhoneNumber.util";

const fullNameSchema = z.string().refine((value) => value.trim().length > 0, {
  message: "Full name is required.",
});

const phoneNumberSchema = z.string().superRefine((value, context) => {
  const phoneDigits = sanitizeSignUpPhoneDigits(value);

  if (phoneDigits.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Phone number is required.",
    });
    return;
  }

  if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid phone number.",
    });
  }
});

const e164PhoneNumberSchema = z.string().refine((value) => {
  const normalizedPhoneNumber = normalizePhoneNumber(value);
  return /^\+\d{8,15}$/.test(normalizedPhoneNumber);
}, {
  message: "Invalid phone number format.",
});

const passwordSchema = z.string().refine((value) => value.trim().length > 0, {
  message: "Password is required.",
});

export const signUpFormSchema = z.object({
  fullName: fullNameSchema,
  phoneNumber: phoneNumberSchema,
  password: passwordSchema,
});

export const signUpInputSchema = z.object({
  fullName: fullNameSchema.transform((value) => value.trim()),
  phoneNumber: e164PhoneNumberSchema.transform(normalizePhoneNumber),
  password: passwordSchema.transform((value) => value.trim()),
});
