import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SettingsModal } from "@/feature/appSettings/settings/types/settings.types";
import { describe, expect, it } from "vitest";

const workspacePath = (...segments: string[]) =>
  resolve(process.cwd(), ...segments);

describe("settings support presentation contract", () => {
  it("does not expose or render the retired V1 rating presentation", () => {
    const settingsScreenSource = readFileSync(
      workspacePath(
        "feature",
        "appSettings",
        "settings",
        "ui",
        "SettingsScreen.tsx",
      ),
      "utf8",
    );
    const rateModalPath = workspacePath(
      "feature",
      "appSettings",
      "settings",
      "ui",
      "components",
      "RateELekhaModal.tsx",
    );

    expect(settingsScreenSource).not.toContain("RateELekhaModal");
    expect(settingsScreenSource).not.toContain("rateELekha");
    expect(SettingsModal).not.toHaveProperty("RateELekha");
    expect(existsSync(rateModalPath)).toBe(false);
  });

  it("does not construct local bug persistence or rating use cases in Settings", () => {
    const factorySource = readFileSync(
      workspacePath(
        "feature",
        "appSettings",
        "settings",
        "factory",
        "getSettingsScreen.factory.tsx",
      ),
      "utf8",
    );
    const viewModelSource = readFileSync(
      workspacePath(
        "feature",
        "appSettings",
        "settings",
        "viewModel",
        "settings.viewModel.impl.ts",
      ),
      "utf8",
    );
    const reportBugModalSource = readFileSync(
      workspacePath(
        "feature",
        "appSettings",
        "settings",
        "ui",
        "components",
        "ReportBugModal.tsx",
      ),
      "utf8",
    );

    expect(factorySource).toContain("createOpenBugReportEmailUseCase");
    expect(factorySource).not.toContain("createSubmitBugReportUseCase");
    expect(factorySource).not.toContain("createSubmitAppRatingUseCase");
    expect(viewModelSource).not.toContain("submitBugReportUseCase");
    expect(viewModelSource).not.toContain(
      "Bug report submitted successfully.",
    );
    expect(viewModelSource).not.toContain("onSubmitRating");
    expect(reportBugModalSource).toContain("Email Bug Report");
    expect(reportBugModalSource).toContain("Opening Email...");
    expect(reportBugModalSource).not.toContain("Submit Bug Report");
    expect(reportBugModalSource).not.toContain("Submitting Report...");
  });
});
