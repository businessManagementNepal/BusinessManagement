import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import appDatabase from "@/app/database/database";
import { GetLoginScreenFactory } from "@/feature/auth/login/factory/getLoginScreen.factory";

export default function LoginRoute() {
  const router = useRouter();

  const handleOnSuccess = useCallback(() => {
    router.replace("/(account-setup)/select-account");
  }, [router]);

  return <GetLoginScreenFactory database={appDatabase} onSuccess={handleOnSuccess} />;
}