import { describe, expect, it } from "vitest";
import { StartupBootstrapStatus } from "@/feature/startup/types/startup.types";
import {
  resolveStartupPresentationState,
  StartupPresentationMode,
} from "@/feature/startup/utils/resolveStartupPresentationState.util";

describe("startup presentation state", () => {
  it("uses loading mode while startup is still loading", () => {
    const result = resolveStartupPresentationState({
      fontsLoaded: true,
      startupStatus: StartupBootstrapStatus.Loading,
    });

    expect(result).toEqual({
      mode: StartupPresentationMode.Loading,
      shouldMountSessionProvider: false,
    });
  });

  it("uses failure mode when startup fails even if fonts are not loaded", () => {
    const result = resolveStartupPresentationState({
      fontsLoaded: false,
      startupStatus: StartupBootstrapStatus.Failed,
    });

    expect(result).toEqual({
      mode: StartupPresentationMode.Failure,
      shouldMountSessionProvider: false,
    });
  });

  it("uses session mode only when startup is ready and fonts are loaded", () => {
    const result = resolveStartupPresentationState({
      fontsLoaded: true,
      startupStatus: StartupBootstrapStatus.Ready,
    });

    expect(result).toEqual({
      mode: StartupPresentationMode.Session,
      shouldMountSessionProvider: true,
    });
  });

  it("stays in loading mode when startup is ready but fonts are not loaded", () => {
    const result = resolveStartupPresentationState({
      fontsLoaded: false,
      startupStatus: StartupBootstrapStatus.Ready,
    });

    expect(result).toEqual({
      mode: StartupPresentationMode.Loading,
      shouldMountSessionProvider: false,
    });
  });
});
