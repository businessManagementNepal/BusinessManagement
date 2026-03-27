import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { bootstrapSelectedLanguage } from "@/shared/i18n/resources/bootstrapSelectedLanguage";
import { useCurrentLanguageCode } from "@/shared/i18n/resources";

export default function RootLayout() {
  const [isLanguageReady, setIsLanguageReady] = React.useState(false);
  const languageCode = useCurrentLanguageCode();

  React.useEffect(() => {
    let isMounted = true;

    const bootstrapLanguage = async (): Promise<void> => {
      await bootstrapSelectedLanguage();

      if (isMounted) {
        setIsLanguageReady(true);
      }
    };

    void bootstrapLanguage();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isLanguageReady) {
    return <SafeAreaProvider style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <Stack key={languageCode} screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
