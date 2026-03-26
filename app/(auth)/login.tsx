import React, { useCallback } from "react";
import { useRouter } from "expo-router";
import database from "@/app/database/database";
import getLoginScreenFactory from "@/feature/auth/login/factory/getLoginScreen.factory";


export default function LoginRoute() {
  const router = useRouter();

  const handleOnSuccess = useCallback(() => {
    router.replace("./(account-setup)/select-account");
  }, [router]);

  return getLoginScreenFactory({
    database,
    onSuccess: handleOnSuccess,
  });
}