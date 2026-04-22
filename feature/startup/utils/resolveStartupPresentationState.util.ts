import {
  StartupBootstrapStatus,
  StartupBootstrapStatusValue,
} from "@/feature/startup/types/startup.types";

export const StartupPresentationMode = {
  Loading: "loading",
  Failure: "failure",
  Session: "session",
} as const;

export type StartupPresentationModeValue =
  (typeof StartupPresentationMode)[keyof typeof StartupPresentationMode];

export type StartupPresentationState = {
  mode: StartupPresentationModeValue;
  shouldMountSessionProvider: boolean;
};

type ResolveStartupPresentationStateParams = {
  fontsLoaded: boolean;
  startupStatus: StartupBootstrapStatusValue;
};

export const resolveStartupPresentationState = ({
  fontsLoaded,
  startupStatus,
}: ResolveStartupPresentationStateParams): StartupPresentationState => {
  if (startupStatus === StartupBootstrapStatus.Failed) {
    return {
      mode: StartupPresentationMode.Failure,
      shouldMountSessionProvider: false,
    };
  }

  if (fontsLoaded && startupStatus === StartupBootstrapStatus.Ready) {
    return {
      mode: StartupPresentationMode.Session,
      shouldMountSessionProvider: true,
    };
  }

  return {
    mode: StartupPresentationMode.Loading,
    shouldMountSessionProvider: false,
  };
};
