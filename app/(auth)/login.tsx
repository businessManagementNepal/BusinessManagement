import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import appDatabase from "@/app/database/database";
import { hasActiveUserSession } from "@/feature/session/data/appSession.store";
import { GetLoginScreenFactory } from "@/feature/auth/login/factory/getLoginScreen.factory";

export default function LoginRoute() {
  const router = useRouter();
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const handleOnSuccess = useCallback(() => {
    router.replace("/(account-setup)/select-account");
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const activeSession = await hasActiveUserSession(appDatabase);

        if (!isMounted) {
          return;
        }

        setHasSession(activeSession);
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isSessionLoading && hasSession) {
      router.replace("/(account-setup)/select-account");
    }
  }, [hasSession, isSessionLoading, router]);

  if (isSessionLoading || hasSession) {
    return null;
  }

  return <GetLoginScreenFactory database={appDatabase} onSuccess={handleOnSuccess} />;
}