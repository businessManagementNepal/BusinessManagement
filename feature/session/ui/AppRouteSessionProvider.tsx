import { getAppSessionState } from "@/feature/appSettings/data/appSettings.store";
import { AppSettingsModel } from "@/feature/appSettings/data/dataSource/db/appSettings.model";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import {
  AccountType,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createGetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase.impl";
import { buildInitials } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import { createGetAuthUserByRemoteIdUseCase } from "@/feature/session/useCase/getAuthUserByRemoteId.useCase.impl";
import { createLocalLedgerDatasource } from "@/feature/ledger/data/dataSource/local.ledger.datasource.impl";
import { createLedgerRepository } from "@/feature/ledger/data/repository/ledger.repository.impl";
import { createGetLedgerEntriesUseCase } from "@/feature/ledger/useCase/getLedgerEntries.useCase.impl";
import {
  clearLedgerReminderNotifications,
  syncLedgerReminderNotifications,
} from "@/feature/ledger/reminder/ledgerReminder.scheduler";
import { createLocalUserManagementDatasource } from "@/feature/userManagement/data/dataSource/local.userManagement.datasource.impl";
import { createUserManagementRepository } from "@/feature/userManagement/data/repository/userManagement.repository.impl";
import { TaxModeValue } from "@/shared/types/regionalFinance.types";
import { Database } from "@nozbe/watermelondb";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export const AppRouteSessionStatus = {
  Loading: "loading",
  Authenticated: "authenticated",
  UnauthenticatedOrError: "unauthenticated_or_error",
} as const;

export type AppRouteSessionStatusValue =
  (typeof AppRouteSessionStatus)[keyof typeof AppRouteSessionStatus];

export type DashboardRouteContext = {
  sessionStatus: AppRouteSessionStatusValue;
  isLoading: boolean;
  hasActiveSession: boolean;
  hasActiveAccount: boolean;
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  activeAccountDefaultTaxRatePercent: number | null;
  activeAccountDefaultTaxMode: TaxModeValue | null;
  activeAccountDisplayName: string;
  profileName: string;
  profileInitials: string;
  sessionError: string | null;
};

export type AppRouteSessionValue = DashboardRouteContext & {
  refreshSession: () => Promise<void>;
};

const INITIAL_CONTEXT: DashboardRouteContext = {
  sessionStatus: AppRouteSessionStatus.Loading,
  isLoading: true,
  hasActiveSession: false,
  hasActiveAccount: false,
  activeUserRemoteId: null,
  activeAccountRemoteId: null,
  activeAccountType: null,
  activeAccountCurrencyCode: null,
  activeAccountCountryCode: null,
  activeAccountDefaultTaxRatePercent: null,
  activeAccountDefaultTaxMode: null,
  activeAccountDisplayName: "",
  profileName: "eLekha User",
  profileInitials: "EL",
  sessionError: null,
};

const APP_SETTINGS_TABLE = "app_settings";

const noopRefreshSession = async (): Promise<void> => {};

type AppRouteSessionProviderProps = {
  database: Database;
  children: React.ReactNode;
};

const AppRouteSessionContext = createContext<AppRouteSessionValue>({
  ...INITIAL_CONTEXT,
  refreshSession: noopRefreshSession,
});

export function AppRouteSessionProvider({
  database,
  children,
}: AppRouteSessionProviderProps) {
  const [context, setContext] =
    useState<DashboardRouteContext>(INITIAL_CONTEXT);
  const isMountedRef = useRef(false);
  const activeRequestIdRef = useRef(0);
  const lastKnownGoodContextRef = useRef<DashboardRouteContext | null>(null);

  const accountDatasource = useMemo(
    () => createLocalAccountDatasource(database),
    [database],
  );

  const accountRepository = useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );

  const authUserDatasource = useMemo(
    () => createLocalAuthUserDatasource(database),
    [database],
  );

  const authUserRepository = useMemo(
    () => createAuthUserRepository(authUserDatasource),
    [authUserDatasource],
  );

  const getAuthUserByRemoteIdUseCase = useMemo(
    () => createGetAuthUserByRemoteIdUseCase(authUserRepository),
    [authUserRepository],
  );

  const ledgerDatasource = useMemo(
    () => createLocalLedgerDatasource(database),
    [database],
  );

  const ledgerRepository = useMemo(
    () => createLedgerRepository(ledgerDatasource),
    [ledgerDatasource],
  );

  const getLedgerEntriesUseCase = useMemo(
    () => createGetLedgerEntriesUseCase(ledgerRepository),
    [ledgerRepository],
  );

  const userManagementDatasource = useMemo(
    () => createLocalUserManagementDatasource(database),
    [database],
  );

  const userManagementRepository = useMemo(
    () =>
      createUserManagementRepository({
        localDatasource: userManagementDatasource,
        accountRepository,
        authUserRepository,
      }),
    [accountRepository, authUserRepository, userManagementDatasource],
  );

  const getAccessibleAccountsByUserRemoteIdUseCase = useMemo(
    () =>
      createGetAccessibleAccountsByUserRemoteIdUseCase({
        accountRepository,
        userManagementRepository,
      }),
    [accountRepository, userManagementRepository],
  );

  const resolveContext = useCallback(async (): Promise<void> => {
    const requestId = ++activeRequestIdRef.current;

    try {
      const sessionState = await getAppSessionState(database);

      const activeUserRemoteId = sessionState.activeUserRemoteId;
      const activeAccountRemoteId = sessionState.activeAccountRemoteId;

      const hasActiveSession = Boolean(activeUserRemoteId);
      let hasActiveAccount = Boolean(activeAccountRemoteId);
      let activeAccountType: AccountTypeValue | null = null;
      let activeAccountCurrencyCode: string | null = null;
      let activeAccountCountryCode: string | null = null;
      let activeAccountDefaultTaxRatePercent: number | null = null;
      let activeAccountDefaultTaxMode: TaxModeValue | null = null;
      let activeAccountDisplayName = "";
      let sessionError: string | null = null;

      let profileName = "eLekha User";
      let profileInitials = "EL";

      if (hasActiveSession && activeUserRemoteId) {
        const authUserResult =
          await getAuthUserByRemoteIdUseCase.execute(activeUserRemoteId);

        if (authUserResult.success) {
          const userFullName = authUserResult.value.fullName.trim();

          if (userFullName) {
            profileName = userFullName;
            profileInitials = buildInitials(userFullName);
          }
        }

        const accountsResult =
          await getAccessibleAccountsByUserRemoteIdUseCase.execute(
            activeUserRemoteId,
          );

        if (accountsResult.success) {
          if (accountsResult.value.length === 0) {
            hasActiveAccount = false;
            sessionError =
              "No active accounts are assigned to this user. Contact your account owner.";
          }

          const activeAccount = accountsResult.value.find(
            (account) => account.remoteId === activeAccountRemoteId,
          );

          if (activeAccount) {
            hasActiveAccount = true;
            activeAccountType = activeAccount.accountType;
            activeAccountCurrencyCode = activeAccount.currencyCode;
            activeAccountCountryCode = activeAccount.countryCode;
            activeAccountDefaultTaxRatePercent =
              activeAccount.defaultTaxRatePercent ?? null;
            activeAccountDefaultTaxMode = activeAccount.defaultTaxMode ?? null;
            activeAccountDisplayName = activeAccount.displayName;

            if (profileName === "eLekha User") {
              profileName = activeAccount.displayName;
              profileInitials = buildInitials(activeAccount.displayName);
            }
          } else {
            hasActiveAccount = false;
          }
        } else {
          hasActiveAccount = false;
          sessionError = accountsResult.error.message;
        }
      }

      if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
        return;
      }

      const nextContext: DashboardRouteContext = {
        sessionStatus: hasActiveSession
          ? AppRouteSessionStatus.Authenticated
          : AppRouteSessionStatus.UnauthenticatedOrError,
        isLoading: false,
        hasActiveSession,
        hasActiveAccount,
        activeUserRemoteId,
        activeAccountRemoteId,
        activeAccountType,
        activeAccountCurrencyCode,
        activeAccountCountryCode,
        activeAccountDefaultTaxRatePercent,
        activeAccountDefaultTaxMode,
        activeAccountDisplayName,
        profileName,
        profileInitials,
        sessionError,
      };

      if (nextContext.hasActiveSession) {
        lastKnownGoodContextRef.current = nextContext;
      } else {
        lastKnownGoodContextRef.current = null;
      }

      setContext(nextContext);
    } catch (error) {
      if (!isMountedRef.current || requestId !== activeRequestIdRef.current) {
        return;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resolve session state.";

      if (lastKnownGoodContextRef.current?.hasActiveSession) {
        setContext({
          ...lastKnownGoodContextRef.current,
          sessionStatus: AppRouteSessionStatus.Authenticated,
          isLoading: false,
          sessionError: errorMessage,
        });
        return;
      }

      setContext({
        ...INITIAL_CONTEXT,
        sessionStatus: AppRouteSessionStatus.UnauthenticatedOrError,
        isLoading: false,
        sessionError: errorMessage,
      });
    }
  }, [
    database,
    getAccessibleAccountsByUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    const appSettingsCollection =
      database.get<AppSettingsModel>(APP_SETTINGS_TABLE);

    const subscription = appSettingsCollection
      .query()
      .observeWithColumns([
        "active_user_remote_id",
        "active_account_remote_id",
        "selected_language",
      ])
      .subscribe(() => {
        void resolveContext();
      });

    void resolveContext();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [database, resolveContext]);

  useEffect(() => {
    const activeBusinessAccountRemoteId =
      context.activeAccountType === AccountType.Business
        ? context.activeAccountRemoteId
        : null;

    if (!activeBusinessAccountRemoteId) {
      void clearLedgerReminderNotifications();
      return;
    }

    let cancelled = false;

    const syncReminders = async () => {
      const entriesResult = await getLedgerEntriesUseCase.execute({
        businessAccountRemoteId: activeBusinessAccountRemoteId,
      });

      if (!entriesResult.success || cancelled) {
        return;
      }

      await syncLedgerReminderNotifications(entriesResult.value);
    };

    void syncReminders();

    return () => {
      cancelled = true;
    };
  }, [
    context.activeAccountRemoteId,
    context.activeAccountType,
    getLedgerEntriesUseCase,
  ]);

  const value = useMemo<AppRouteSessionValue>(
    () => ({
      ...context,
      refreshSession: resolveContext,
    }),
    [context, resolveContext],
  );

  return (
    <AppRouteSessionContext.Provider value={value}>
      {children}
    </AppRouteSessionContext.Provider>
  );
}

export const useAppRouteSession = (): AppRouteSessionValue => {
  return useContext(AppRouteSessionContext);
};
