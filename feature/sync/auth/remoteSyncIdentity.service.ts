import { Account, AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import { AuthUser } from "@/feature/session/types/authSession.types";
import { AuthTokenStore } from "@/shared/auth/authTokenStore";
import { isNetworkError } from "@/shared/network/networkError";
import { Result } from "@/shared/types/result.types";
import {
  RemoteAuthSession,
  RemoteSyncAuthClient,
} from "./remoteSyncAuth.client";
import { SyncIdentityBindingRepository } from "../data/repository/syncIdentityBinding.repository";
import {
  SyncAccountBinding,
  SyncUserBinding,
} from "../types/syncIdentity.types";

type BootstrapRemoteIdentityInput = {
  localUser: AuthUser;
  loginId: string;
  password: string;
};

type EnsureRemoteBusinessAccountBindingInput = {
  localUserRemoteId: string;
  localAccount: Account;
};

type SelectRemoteAccountInput = {
  localAccountRemoteId: string;
  deviceId: string;
};

export interface RemoteSyncIdentityService {
  bootstrapAfterLocalLogin(
    input: BootstrapRemoteIdentityInput,
  ): Promise<Result<SyncUserBinding>>;
  bootstrapAfterLocalRegistration(
    input: BootstrapRemoteIdentityInput,
  ): Promise<Result<SyncUserBinding>>;
  ensureRemoteBusinessAccountBinding(
    input: EnsureRemoteBusinessAccountBindingInput,
  ): Promise<Result<SyncAccountBinding>>;
  selectRemoteAccount(
    input: SelectRemoteAccountInput,
  ): Promise<Result<boolean>>;
}

type CreateRemoteSyncIdentityServiceParams = {
  remoteAuthClient: RemoteSyncAuthClient;
  tokenStore: AuthTokenStore;
  bindingRepository: SyncIdentityBindingRepository;
};

const normalizeRequired = (value: string): string => value.trim();

const normalizeOptional = (value: string | null | undefined): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const shouldFallbackFromLoginToRegister = (error: Error): boolean => {
  return (
    isNetworkError(error) &&
    error.status !== null &&
    [400, 401, 404, 409, 422].includes(error.status)
  );
};

const shouldFallbackFromRegisterToLogin = (error: Error): boolean => {
  return (
    isNetworkError(error) &&
    error.status !== null &&
    [400, 401, 404, 409, 422].includes(error.status)
  );
};

const buildRegisterPayload = (input: BootstrapRemoteIdentityInput) => {
  const email = normalizeOptional(input.localUser.email);

  return {
    username: normalizeRequired(input.loginId),
    password: normalizeRequired(input.password),
    ...(email ? { email } : {}),
    displayName: normalizeRequired(input.localUser.fullName),
    phoneNumber:
      normalizeOptional(input.localUser.phone) ??
      normalizeRequired(input.loginId),
  };
};

const persistRemoteSession = async ({
  localUserRemoteId,
  session,
  tokenStore,
  bindingRepository,
}: {
  localUserRemoteId: string;
  session: RemoteAuthSession;
  tokenStore: AuthTokenStore;
  bindingRepository: SyncIdentityBindingRepository;
}): Promise<Result<SyncUserBinding>> => {
  try {
    await tokenStore.saveTokens({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });

    const bindingResult = await bindingRepository.saveUserBinding({
      localUserRemoteId,
      remoteUserRemoteId: session.user.remoteId,
    });

    if (!bindingResult.success) {
      await tokenStore.clearTokens();
      return bindingResult;
    }

    return bindingResult;
  } catch (error) {
    await tokenStore.clearTokens();
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
};

export const createRemoteSyncIdentityService = ({
  remoteAuthClient,
  tokenStore,
  bindingRepository,
}: CreateRemoteSyncIdentityServiceParams): RemoteSyncIdentityService => ({
  async bootstrapAfterLocalLogin(input) {
    const loginId = normalizeRequired(input.loginId);
    const password = normalizeRequired(input.password);

    if (!loginId || !password) {
      await tokenStore.clearTokens();
      return {
        success: false,
        error: new Error("Backend sign-in requires a login id and password."),
      };
    }

    try {
      const session = await remoteAuthClient.login({
        username: loginId,
        password,
      });

      return persistRemoteSession({
        localUserRemoteId: input.localUser.remoteId,
        session,
        tokenStore,
        bindingRepository,
      });
    } catch (error) {
      if (!(error instanceof Error) || !shouldFallbackFromLoginToRegister(error)) {
        await tokenStore.clearTokens();
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    }

    try {
      const session = await remoteAuthClient.register(buildRegisterPayload(input));
      return persistRemoteSession({
        localUserRemoteId: input.localUser.remoteId,
        session,
        tokenStore,
        bindingRepository,
      });
    } catch (error) {
      await tokenStore.clearTokens();
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async bootstrapAfterLocalRegistration(input) {
    const loginId = normalizeRequired(input.loginId);
    const password = normalizeRequired(input.password);

    if (!loginId || !password) {
      await tokenStore.clearTokens();
      return {
        success: false,
        error: new Error("Backend sign-up requires a login id and password."),
      };
    }

    try {
      const session = await remoteAuthClient.register(buildRegisterPayload(input));
      return persistRemoteSession({
        localUserRemoteId: input.localUser.remoteId,
        session,
        tokenStore,
        bindingRepository,
      });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !shouldFallbackFromRegisterToLogin(error)
      ) {
        await tokenStore.clearTokens();
        return {
          success: false,
          error: error instanceof Error ? error : new Error("Unknown error"),
        };
      }
    }

    try {
      const session = await remoteAuthClient.login({
        username: loginId,
        password,
      });

      return persistRemoteSession({
        localUserRemoteId: input.localUser.remoteId,
        session,
        tokenStore,
        bindingRepository,
      });
    } catch (error) {
      await tokenStore.clearTokens();
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async ensureRemoteBusinessAccountBinding({
    localUserRemoteId,
    localAccount,
  }) {
    const existingBindingResult =
      await bindingRepository.getAccountBindingByLocalAccountRemoteId(
        localAccount.remoteId,
      );
    if (!existingBindingResult.success) {
      return existingBindingResult;
    }

    if (existingBindingResult.value) {
      return {
        success: true,
        value: existingBindingResult.value,
      };
    }

    if (localAccount.accountType !== AccountType.Business) {
      return {
        success: false,
        error: new Error("Sync is currently available only for business accounts."),
      };
    }

    if (
      normalizeRequired(localAccount.ownerUserRemoteId) !==
      normalizeRequired(localUserRemoteId)
    ) {
      return {
        success: false,
        error: new Error(
          "Sync account linking currently requires the local account owner.",
        ),
      };
    }

    const userBindingResult =
      await bindingRepository.getUserBindingByLocalUserRemoteId(localUserRemoteId);
    if (!userBindingResult.success) {
      return userBindingResult;
    }

    if (!userBindingResult.value) {
      return {
        success: false,
        error: new Error(
          "No backend user is linked to this local session. Sign in again before syncing.",
        ),
      };
    }

    try {
      const remoteAccount = await remoteAuthClient.createBusinessAccount({
        displayName: normalizeRequired(localAccount.displayName),
        countryCode: normalizeOptional(localAccount.countryCode) ?? undefined,
        currencyCode: normalizeOptional(localAccount.currencyCode) ?? undefined,
      });

      return bindingRepository.saveAccountBinding({
        localUserRemoteId,
        remoteUserRemoteId: userBindingResult.value.remoteUserRemoteId,
        localAccountRemoteId: localAccount.remoteId,
        remoteAccountRemoteId: remoteAccount.remoteId,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },

  async selectRemoteAccount({ localAccountRemoteId, deviceId }) {
    const accountBindingResult =
      await bindingRepository.getAccountBindingByLocalAccountRemoteId(
        localAccountRemoteId,
      );
    if (!accountBindingResult.success) {
      return accountBindingResult;
    }

    if (!accountBindingResult.value) {
      return {
        success: false,
        error: new Error("No backend account is linked to the selected account."),
      };
    }

    try {
      await remoteAuthClient.selectAccount({
        remoteAccountRemoteId: accountBindingResult.value.remoteAccountRemoteId,
        deviceId,
      });

      return {
        success: true,
        value: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  },
});
