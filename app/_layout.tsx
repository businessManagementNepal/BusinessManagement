import React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import appDatabase from "@/shared/database/appDatabase";
import {
  AppRouteSessionStatus,
  AppRouteSessionProvider,
  useAppRouteSession,
} from "@/feature/session/ui/AppRouteSessionProvider";
import { colors } from "@/shared/components/theme/colors";
import { useCurrentLanguageCode } from "@/shared/i18n/resources";
import { applyGlobalTypographyDefaults } from "@/shared/components/theme/typography";
import { StartupBootstrapStatus } from "@/feature/startup/types/startup.types";
import { useStartupBootstrapFactory } from "@/feature/startup/factory/useStartupBootstrap.factory";
import { useStartupSplashGateViewModel } from "@/feature/startup/viewModel/startupSplashGate.viewModel.impl";
import { AnimatedSplashScreen } from "@/feature/startup/ui/AnimatedSplashScreen";
import { StartupBootstrapBoundary } from "@/feature/startup/ui/StartupBootstrapBoundary";
import {
  resolveStartupPresentationState,
  StartupPresentationMode,
} from "@/feature/startup/utils/resolveStartupPresentationState.util";

applyGlobalTypographyDefaults();

void SplashScreen.preventAutoHideAsync().catch(() => {
  return undefined;
});

type StartupBootstrapStatusValue =
  (typeof StartupBootstrapStatus)[keyof typeof StartupBootstrapStatus];

type SessionStartupOverlayControllerProps = {
  fontsLoaded: boolean;
};

type SessionRootNavigatorProps = {
  languageCode: string;
};

function SessionStartupOverlayController({
  fontsLoaded,
}: SessionStartupOverlayControllerProps) {
  const { isLoading } = useAppRouteSession();

  const splashGateViewModel = useStartupSplashGateViewModel({
    fontsLoaded,
    startupStatus: StartupBootstrapStatus.Ready,
    isSessionLoading: isLoading,
  });

  if (!splashGateViewModel.shouldShowAnimatedSplash) {
    return null;
  }

  return (
    <View style={styles.startupOverlay} pointerEvents="auto">
      <AnimatedSplashScreen
        onFinish={splashGateViewModel.onAnimatedSplashFinish}
      />
    </View>
  );
}

function SessionRootNavigator({ languageCode }: SessionRootNavigatorProps) {
  const { isLoading, hasActiveSession, hasActiveAccount, sessionStatus } =
    useAppRouteSession();

  if (isLoading) {
    return null;
  }

  const isAuthenticated =
    sessionStatus === AppRouteSessionStatus.Authenticated && hasActiveSession;
  const shouldShowAccountSetup = isAuthenticated && !hasActiveAccount;

  return (
    <Stack
      key={languageCode}
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>

      <Stack.Protected guard={shouldShowAccountSetup}>
        <Stack.Screen name="(account-setup)/select-account" />
      </Stack.Protected>

      <Stack.Protected guard={isAuthenticated && hasActiveAccount}>
        <Stack.Screen name="(dashboard)" />
      </Stack.Protected>

      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    InterRegular: require("../assets/fonts/Inter_18pt-Regular.ttf"),
    InterMedium: require("../assets/fonts/Inter_18pt-Medium.ttf"),
    InterSemiBold: require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    InterBold: require("../assets/fonts/Inter_18pt-Bold.ttf"),
  });

  const startupBootstrapViewModel = useStartupBootstrapFactory({
    database: appDatabase,
  });

  const languageCode = useCurrentLanguageCode();

  const fontErrorMessage = React.useMemo(() => {
    if (!fontsError) {
      return null;
    }

    if (fontsError instanceof Error) {
      return fontsError.message;
    }

    return "Unable to load app fonts.";
  }, [fontsError]);

  const startupStatus: StartupBootstrapStatusValue = fontErrorMessage
    ? StartupBootstrapStatus.Failed
    : startupBootstrapViewModel.status;

  const startupErrorMessage =
    fontErrorMessage ?? startupBootstrapViewModel.errorMessage;

  const startupReasonCode = fontErrorMessage
    ? "FONT_LOAD_FAILED"
    : startupBootstrapViewModel.reasonCode;

  const startupFailedTaskKey = fontErrorMessage
    ? "font_load"
    : startupBootstrapViewModel.failedTaskKey;

  const onRetryStartup = React.useMemo<(() => Promise<void>) | null>(() => {
    if (fontErrorMessage) {
      return null;
    }

    return startupBootstrapViewModel.retry;
  }, [fontErrorMessage, startupBootstrapViewModel.retry]);

  const startupPresentationState = React.useMemo(
    () =>
      resolveStartupPresentationState({
        fontsLoaded,
        startupStatus,
      }),
    [fontsLoaded, startupStatus],
  );

  return (
    <SafeAreaProvider style={styles.rootSafeArea}>
      <View style={styles.rootContainer}>
        {startupPresentationState.mode !== StartupPresentationMode.Session ? (
          <StartupBootstrapBoundary
            fontsLoaded={fontsLoaded}
            startupStatus={startupStatus}
            message={startupErrorMessage ?? "Unable to initialize app startup."}
            onRetry={onRetryStartup}
            reasonCode={startupReasonCode}
            failedTaskKey={startupFailedTaskKey}
          />
        ) : null}

        {startupPresentationState.shouldMountSessionProvider ? (
          <AppRouteSessionProvider database={appDatabase}>
            <SessionRootNavigator languageCode={languageCode} />
            <SessionStartupOverlayController fontsLoaded={fontsLoaded} />
          </AppRouteSessionProvider>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootSafeArea: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  startupOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
});
