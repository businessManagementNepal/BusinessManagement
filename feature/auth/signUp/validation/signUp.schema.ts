import { z } from "zod";
import { normalizePhoneNumber } from "@/shared/utils/auth/phoneNumber.util";

const fullNameSchema = z.string().refine((value) => value.trim().length > 0, {
  message: "Full name is required.",
});

const phoneNumberSchema = z.string().refine(
  (value) => normalizePhoneNumber(value).length > 0,
  {
    message: "Phone number is required.",
  },
);

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
  phoneNumber: phoneNumberSchema.transform(normalizePhoneNumber),
  password: passwordSchema.transform((value) => value.trim()),
});
