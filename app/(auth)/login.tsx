import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import appDatabase from "@/app/database/database";
import { hasActiveUserSession } from "@/feature/appSettings/data/appSettings.store";
import { GetAuthEntryScreenFactory } from "@/feature/auth/entry/factory/getAuthEntryScreen.factory";
import { warmDatabaseFieldEncryptionKey } from "@/shared/utils/security/databaseFieldEncryption.service";

export default function LoginRoute() {
  const router = useRouter();
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const handleOnSuccess = useCallback(() => {
    router.replace("/(account-setup)/select-account");
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    void warmDatabaseFieldEncryptionKey().catch(() => {});

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

  return (
    <GetAuthEntryScreenFactory
      database={appDatabase}
      onSuccess={handleOnSuccess}
    />
  );
}

