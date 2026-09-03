import React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";
import appDatabase from "@/shared/database/appDatabase";
import {
  AppRouteSessionStatus,
  AppRouteSessionProvider,
  useAppRouteSession,
} from "@/feature/session/ui/AppRouteSessionProvider";
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
import {
  AppThemeProvider,
  useAppTheme,
} from "@/shared/components/theme/AppThemeProvider";

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

  if (!splashGateViewModel.shouldRenderAnimatedSplash) {
    return null;
  }

  return (
    <View style={styles.startupOverlay} pointerEvents="auto">
      <AnimatedSplashScreen
        isActive={splashGateViewModel.shouldAnimateSplash}
        onFinish={splashGateViewModel.onAnimatedSplashFinish}
      />
    </View>
  );
}

function SessionRootNavigator({ languageCode }: SessionRootNavigatorProps) {
  const { isLoading, hasActiveSession, hasActiveAccount, sessionStatus } =
    useAppRouteSession();
  const theme = useAppTheme();

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
        contentStyle: { backgroundColor: theme.colors.background },
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

function RootLayoutContent() {
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
  const theme = useAppTheme();

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
    <SafeAreaProvider
      style={[
        styles.rootSafeArea,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar style={theme.isDarkMode ? "light" : "dark"} />

      <View
        style={[
          styles.rootContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
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

        <Toast />
      </View>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider database={appDatabase}>
      <RootLayoutContent />
    </AppThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootSafeArea: {
    flex: 1,
  },
  rootContainer: {
    flex: 1,
  },
  startupOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
});
