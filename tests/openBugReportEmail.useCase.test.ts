import {
  buildBugReportEmailUri,
  createOpenBugReportEmailUseCase,
  NO_EMAIL_APP_AVAILABLE_MESSAGE,
} from "@/feature/appSettings/settings/useCase/openBugReportEmail.useCase.impl";
import { BugSeverity } from "@/feature/appSettings/settings/types/settings.types";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Linking: {
    canOpenURL: vi.fn(),
    openURL: vi.fn(),
  },
}));

const bugReportPayload = {
  title: "Invoice total incorrect",
  description:
    "The invoice total is different from the displayed item total.",
  severity: BugSeverity.High,
  appVersion: "1.0.0 (42)",
  deviceInfo: "Android 15 / Pixel 8",
};

const readEmailUri = (uri: string) => {
  const [recipient, query = ""] = uri.split("?");
  const queryParams = new URLSearchParams(query);

  return {
    recipient,
    subject: queryParams.get("subject"),
    body: queryParams.get("body"),
  };
};

describe("openBugReportEmail.useCase", () => {
  it("requires a non-empty bug title", async () => {
    const emailLinking = {
      canOpenURL: vi.fn(async (_url: string) => true),
      openURL: vi.fn(async (_url: string) => undefined),
    };
    const useCase = createOpenBugReportEmailUseCase(emailLinking);

    const result = await useCase.execute({
      ...bugReportPayload,
      title: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({ message: "Bug title is required." }),
    });
    expect(emailLinking.canOpenURL).not.toHaveBeenCalled();
    expect(emailLinking.openURL).not.toHaveBeenCalled();
  });

  it("requires a non-empty bug description", async () => {
    const emailLinking = {
      canOpenURL: vi.fn(async (_url: string) => true),
      openURL: vi.fn(async (_url: string) => undefined),
    };
    const useCase = createOpenBugReportEmailUseCase(emailLinking);

    const result = await useCase.execute({
      ...bugReportPayload,
      description: "\n\t",
    });

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({
        message: "Describe the issue before emailing.",
      }),
    });
    expect(emailLinking.canOpenURL).not.toHaveBeenCalled();
    expect(emailLinking.openURL).not.toHaveBeenCalled();
  });

  it("builds an encoded support email containing only whitelisted bug details", () => {
    const uri = buildBugReportEmailUri({
      ...bugReportPayload,
      title: "Invoice & payment? #42",
      description: "Total is NPR 1,000 + tax; expected 1,130.",
    });
    const email = readEmailUri(uri);

    expect(email.recipient).toBe("mailto:support@e-lekha.com");
    expect(email.subject).toBe(
      "eLekha Bug Report: Invoice & payment? #42",
    );
    expect(email.body).toContain("Severity:\nHigh");
    expect(email.body).toContain(
      "Description:\nTotal is NPR 1,000 + tax; expected 1,130.",
    );
    expect(email.body).toContain("App version:\n1.0.0 (42)");
    expect(email.body).toContain(
      "Platform/device:\nAndroid 15 / Pixel 8",
    );
    expect(uri).toContain("Invoice%20%26%20payment%3F%20%2342");
    expect(uri).toContain("NPR%201%2C000%20%2B%20tax%3B");

    const automaticallyExcludedValues = [
      "password-secret",
      "access-token-secret",
      "refresh-token-secret",
      "active-user-remote-id",
      "active-account-remote-id",
      "customer-list-record",
      "ledger-balance-record",
      "transaction-history-record",
    ];
    for (const sensitiveValue of automaticallyExcludedValues) {
      expect(uri).not.toContain(sensitiveValue);
      expect(email.body).not.toContain(sensitiveValue);
    }
  });

  it("checks for an email handler and opens the generated draft", async () => {
    const emailLinking = {
      canOpenURL: vi.fn(async (_url: string) => true),
      openURL: vi.fn(async (_url: string) => undefined),
    };
    const useCase = createOpenBugReportEmailUseCase(emailLinking);

    const result = await useCase.execute(bugReportPayload);

    expect(result).toEqual({ success: true, value: true });
    expect(emailLinking.canOpenURL).toHaveBeenCalledTimes(1);
    expect(emailLinking.openURL).toHaveBeenCalledWith(
      emailLinking.canOpenURL.mock.calls[0]?.[0],
    );
  });

  it("returns the manual support fallback when no email app is available", async () => {
    const emailLinking = {
      canOpenURL: vi.fn(async (_url: string) => false),
      openURL: vi.fn(async (_url: string) => undefined),
    };
    const useCase = createOpenBugReportEmailUseCase(emailLinking);

    const result = await useCase.execute(bugReportPayload);

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({
        message: NO_EMAIL_APP_AVAILABLE_MESSAGE,
      }),
    });
    expect(emailLinking.openURL).not.toHaveBeenCalled();
  });

  it("returns the same manual fallback when opening the email draft fails", async () => {
    const emailLinking = {
      canOpenURL: vi.fn(async (_url: string) => true),
      openURL: vi.fn(async (_url: string) => {
        throw new Error("Email client unavailable");
      }),
    };
    const useCase = createOpenBugReportEmailUseCase(emailLinking);

    const result = await useCase.execute(bugReportPayload);

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({
        message: NO_EMAIL_APP_AVAILABLE_MESSAGE,
      }),
    });
  });
});
