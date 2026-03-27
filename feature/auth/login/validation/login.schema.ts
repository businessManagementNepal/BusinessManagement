import { z } from "zod";
import { normalizePhoneNumber } from "@/shared/utils/auth/phoneNumber.util";

const phoneNumberSchema = z.string().refine(
  (value) => normalizePhoneNumber(value).length > 0,
  {
    message: "Phone number is required.",
  },
);

const passwordSchema = z.string().refine((value) => value.trim().length > 0, {
  message: "Password is required.",
});

export const loginFormSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: passwordSchema,
});

export const loginInputSchema = z.object({
  phoneNumber: phoneNumberSchema.transform(normalizePhoneNumber),
  password: passwordSchema.transform((value) => value.trim()),
});
