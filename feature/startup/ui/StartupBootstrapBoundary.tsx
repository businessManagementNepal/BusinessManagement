import React from "react";
import { StartupBootstrapStatus } from "@/feature/startup/types/startup.types";
import { useStartupSplashGateViewModel } from "@/feature/startup/viewModel/startupSplashGate.viewModel.impl";
import { StartupErrorScreen } from "@/feature/startup/ui/StartupErrorScreen";
import { StartupLoadingScreen } from "@/feature/startup/ui/StartupLoadingScreen";

type StartupBootstrapBoundaryProps = {
  fontsLoaded: boolean;
  startupStatus: (typeof StartupBootstrapStatus)[keyof typeof StartupBootstrapStatus];
  message: string;
  onRetry: (() => Promise<void>) | null;
  reasonCode: string | null;
  failedTaskKey: string | null;
};

export function StartupBootstrapBoundary({
  fontsLoaded,
  startupStatus,
  message,
  onRetry,
  reasonCode,
  failedTaskKey,
}: StartupBootstrapBoundaryProps) {
  useStartupSplashGateViewModel({
    fontsLoaded,
    startupStatus,
    isSessionLoading: false,
  });

  if (startupStatus === StartupBootstrapStatus.Failed) {
    return (
      <StartupErrorScreen
        message={message}
        onRetry={onRetry}
        reasonCode={reasonCode}
        failedTaskKey={failedTaskKey}
      />
    );
  }

  return <StartupLoadingScreen />;
}
