import { z } from "zod";
import { normalizePhoneNumber } from "@/shared/utils/auth/phoneNumber.util";

export const signUpInputSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  phoneNumber: z
    .string()
    .transform(normalizePhoneNumber)
    .refine((value) => value.length > 0, {
      message: "Phone number is required.",
    }),
  password: z.string().trim().min(1, "Password is required."),
});
