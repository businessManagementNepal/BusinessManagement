import { EditablePersonalProfile } from "@/feature/profile/screen/types/profileScreen.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;

export type PersonalProfileValidatedField = "fullName" | "phone" | "email";

export type PersonalProfileFieldErrors = Partial<
  Record<PersonalProfileValidatedField, string>
>;

export const isPersonalProfileValidatedField = (
  field: keyof EditablePersonalProfile,
): field is PersonalProfileValidatedField =>
  field === "fullName" || field === "phone" || field === "email";

export const validatePersonalProfileFields = (
  profile: EditablePersonalProfile,
): PersonalProfileFieldErrors => {
  const fieldErrors: PersonalProfileFieldErrors = {};
  const fullName = profile.fullName.trim();
  const phone = profile.phone.trim();
  const email = profile.email.trim();

  if (!fullName) {
    fieldErrors.fullName = "Full name is required.";
  } else if (fullName.length < 2) {
    fieldErrors.fullName = "Full name must be at least 2 characters.";
  }

  if (phone && (!PHONE_REGEX.test(phone) || !/\d/.test(phone))) {
    fieldErrors.phone = "Phone number is invalid.";
  }

  if (email && !EMAIL_REGEX.test(email)) {
    fieldErrors.email = "Email address is invalid.";
  }

  return fieldErrors;
};
