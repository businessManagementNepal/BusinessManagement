import React from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import appDatabase, { ensureDatabaseReady } from "@/shared/database/appDatabase";
import {
  AppRouteSessionStatus,
  AppRouteSessionProvider,
  useAppRouteSession,
} from "@/feature/session/ui/AppRouteSessionProvider";
import { colors } from "@/shared/components/theme/colors";
import { bootstrapSelectedLanguage } from "@/shared/i18n/resources/bootstrapSelectedLanguage";
import { useCurrentLanguageCode } from "@/shared/i18n/resources";
import { applyGlobalTypographyDefaults, fontFamily } from "@/shared/components/theme/typography";

applyGlobalTypographyDefaults();

void SplashScreen.preventAutoHideAsync().catch(() => {
  console.warn("Failed to lock splash screen visibility.");
});

type RootNavigatorProps = {
  languageCode: string;
  startupStatus: "loading" | "ready" | "failed";
  startupError?: string;
  fontsLoaded: boolean;
};

type SplashScreenControllerProps = {
  startupStatus: "loading" | "ready" | "failed";
  fontsLoaded: boolean;
};

function SplashScreenController({
  startupStatus,
  fontsLoaded,
}: SplashScreenControllerProps) {
  const { isLoading } = useAppRouteSession();
  const isStartupReady = startupStatus === "ready";
  const isStartupFailed = startupStatus === "failed";

  React.useEffect(() => {
    if (startupStatus === "loading" || !fontsLoaded) {
      return;
    }

    if (!isStartupFailed && (!isStartupReady || isLoading)) {
      return;
    }

    void SplashScreen.hideAsync().catch(() => {
      console.warn("Failed to hide splash screen.");
    });
  }, [fontsLoaded, isLoading, isStartupFailed, isStartupReady, startupStatus]);

  return null;
}

function RootNavigator({
  languageCode,
  startupStatus,
  startupError,
  fontsLoaded,
}: RootNavigatorProps) {
  const { isLoading, hasActiveSession, hasActiveAccount, sessionStatus } =
    useAppRouteSession();

  if (startupStatus === "failed") {
    return (
      <View style={styles.startupErrorContainer}>
        <Text style={styles.startupErrorTitle}>Startup failed</Text>
        <Text style={styles.startupErrorMessage}>
          {startupError ?? "Unable to initialize local database."}
        </Text>
      </View>
    );
  }

  if (!fontsLoaded || startupStatus !== "ready" || isLoading) {
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

  const [startupStatus, setStartupStatus] = React.useState<
    "loading" | "ready" | "failed"
  >("loading");
  const [startupError, setStartupError] = React.useState<string>();
  const languageCode = useCurrentLanguageCode();

  React.useEffect(() => {
    if (!fontsError) {
      return;
    }

    const resolvedError =
      fontsError instanceof Error
        ? fontsError.message
        : "Unable to load app fonts.";

    console.error("App font loading failed.", fontsError);
    setStartupError(resolvedError);
    setStartupStatus("failed");
  }, [fontsError]);

  React.useEffect(() => {
    let isMounted = true;

    const bootstrapApp = async (): Promise<void> => {
      try {
        await ensureDatabaseReady();
        await bootstrapSelectedLanguage();

        if (!isMounted) {
          return;
        }

        setStartupStatus("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const resolvedError =
          error instanceof Error
            ? error.message
            : "Unable to initialize local database.";

        console.error("App startup failed.", error);
        setStartupError(resolvedError);
        setStartupStatus("failed");
      }
    };

    void bootstrapApp();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppRouteSessionProvider database={appDatabase}>
        <SplashScreenController
          startupStatus={startupStatus}
          fontsLoaded={fontsLoaded}
        />
        <RootNavigator
          languageCode={languageCode}
          startupStatus={startupStatus}
          startupError={startupError}
          fontsLoaded={fontsLoaded}
        />
      </AppRouteSessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  startupErrorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  startupErrorTitle: {
    color: colors.destructive,
    fontFamily: fontFamily.bold,
    fontSize: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  startupErrorMessage: {
    color: colors.foreground,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
