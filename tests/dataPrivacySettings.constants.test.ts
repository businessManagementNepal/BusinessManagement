import {
  SETTINGS_DATA_RIGHT_ITEMS,
  SETTINGS_TERMS_DOCUMENT_ITEMS,
} from "@/feature/appSettings/settings/constants/settings.constants";
import { describe, expect, it } from "vitest";

describe("offline V1 data privacy settings", () => {
  it("keeps local data actions in-app and reserves email for privacy questions", () => {
    expect(SETTINGS_DATA_RIGHT_ITEMS.map((item) => item.label)).toEqual([
      "Stored on this device",
      "Access & Export",
      "Correct Your Data",
      "Delete Profile & All Data",
      "Permissions & Choices",
      "Privacy Questions",
    ]);

    const deletionItem = SETTINGS_DATA_RIGHT_ITEMS.find(
      (item) => item.id === "delete-profile-data",
    );
    expect(deletionItem).toMatchObject({
      description:
        "Permanently delete your local eLekha profile and all eLekha application data stored on this device.",
    });
    expect(deletionItem).not.toHaveProperty("href");
    expect(deletionItem).not.toHaveProperty("actionLabel");

    const privacyQuestionsItem = SETTINGS_DATA_RIGHT_ITEMS.find(
      (item) => item.id === "privacy-questions",
    );
    expect(privacyQuestionsItem?.href).toBe("mailto:support@e-lekha.com");
  });

  it("keeps Terms of Service available inside Data & Privacy", () => {
    expect(
      SETTINGS_TERMS_DOCUMENT_ITEMS.some(
        (item) => item.id === "terms-of-service",
      ),
    ).toBe(true);
  });
});
