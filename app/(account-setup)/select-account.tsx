import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import { GetAccountSelectionScreenFactory } from "@/feature/setting/accounts/accountSelection/factory/getAccountSelectionScreen.factory";

export default function SelectAccountRoute() {
  const router = useRouter();

  const handleBackToLogin = useCallback(() => {
    router.replace("/(auth)/login");
  }, [router]);

  return <GetAccountSelectionScreenFactory onBackToLogin={handleBackToLogin} />;
}
