import React from "react";
import { Database } from "@nozbe/watermelondb";

import { createLocalLoginRepositoryWithDatabase } from "./local.login.repository.factory";
import { useLoginFeature } from "../hooks/useLoginFeature";
import { LoginScreen } from "../ui/LoginScreen";

type GetLoginScreenFactoryParams = {
  database: Database;
  onSuccess?: () => void;
};

export default function getLoginScreenFactory({
  database,
  onSuccess,
}: GetLoginScreenFactoryParams) {
  const repository = createLocalLoginRepositoryWithDatabase(database);

  const LoginScreenContainer = () => {
    useLoginFeature({
      repository,
      onSuccess,
    });

    return <LoginScreen />;
  };

  return <LoginScreenContainer />;
}
