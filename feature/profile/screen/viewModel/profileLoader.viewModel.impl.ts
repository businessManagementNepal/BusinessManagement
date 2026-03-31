import { useCallback, useEffect, useRef, useState } from "react";
import { AccountType } from "@/feature/setting/accounts/accountSelection/types/accountSelection.types";
import {
  createDefaultBusinessProfileForm,
  createEmptyPersonalProfile,
  mapAccountOptionToFallbackBusinessForm,
  mapBusinessProfileToForm,
} from "@/feature/profile/screen/viewModel/profileScreen.shared";
import {
  ProfileLoaderViewModel,
  UseProfileLoaderViewModelParams,
} from "./profileLoader.viewModel";

export const useProfileLoaderViewModel = (
  params: UseProfileLoaderViewModelParams,
): ProfileLoaderViewModel => {
  const {
    activeUserRemoteId,
    activeAccountRemoteId,
    getAccountsByOwnerUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase,
    getBusinessProfileByAccountRemoteIdUseCase,
    onLoaded,
  } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const activeRequestIdRef = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const requestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setLoadError(undefined);

    try {
      if (!activeUserRemoteId) {
        if (requestId === activeRequestIdRef.current) {
          setLoadError("Active user session not found.");
        }
        return;
      }

      const [userResult, accountsResult] = await Promise.all([
        getAuthUserByRemoteIdUseCase.execute(activeUserRemoteId),
        getAccountsByOwnerUserRemoteIdUseCase.execute(activeUserRemoteId),
      ]);

      if (!accountsResult.success) {
        if (requestId === activeRequestIdRef.current) {
          setLoadError(accountsResult.error.message);
        }
        return;
      }

      const accountOptions = accountsResult.value.map((account) => ({
        remoteId: account.remoteId,
        displayName: account.displayName,
        accountType: account.accountType,
        businessType: account.businessType,
        cityOrLocation: account.cityOrLocation,
        countryCode: account.countryCode,
        currencyCode: account.currencyCode,
        isDefault: account.isDefault,
      }));

      const activeAccount = accountOptions.find(
        (account) => account.remoteId === activeAccountRemoteId,
      );

      const personalProfile = userResult.success
        ? {
            fullName: userResult.value.fullName,
            phone: userResult.value.phone ?? "",
            email: userResult.value.email ?? "",
          }
        : createEmptyPersonalProfile();

      if (!activeAccount) {
        if (requestId === activeRequestIdRef.current) {
          onLoaded({
            profileName:
              personalProfile.fullName.trim() ||
              accountOptions[0]?.displayName ||
              "eLekha User",
            loadedAuthUser: userResult.success ? userResult.value : null,
            accountOptions,
            activeAccountRemoteId: null,
            activeAccountType: null,
            activeAccountDisplayName: "",
            personalProfile,
            activeBusinessProfile: createDefaultBusinessProfileForm(),
            hasActiveBusinessProfile: false,
          });

          setLoadError("Active account not found. Please select account again.");
        }
        return;
      }

      let activeBusinessProfile = createDefaultBusinessProfileForm();
      let hasActiveBusinessProfile = false;

      if (activeAccount.accountType === AccountType.Business) {
        const businessProfileResult =
          await getBusinessProfileByAccountRemoteIdUseCase.execute(
            activeAccount.remoteId,
          );

        if (businessProfileResult.success) {
          activeBusinessProfile = mapBusinessProfileToForm(
            businessProfileResult.value,
          );
          hasActiveBusinessProfile = true;
        } else {
          activeBusinessProfile = mapAccountOptionToFallbackBusinessForm(
            activeAccount,
          );
        }
      }

      if (requestId === activeRequestIdRef.current) {
        onLoaded({
          profileName:
            personalProfile.fullName.trim() || activeAccount.displayName,
          loadedAuthUser: userResult.success ? userResult.value : null,
          accountOptions,
          activeAccountRemoteId: activeAccount.remoteId,
          activeAccountType: activeAccount.accountType,
          activeAccountDisplayName: activeAccount.displayName,
          personalProfile,
          activeBusinessProfile,
          hasActiveBusinessProfile,
        });
      }
    } catch (error) {
      console.error("Failed to load profile context.", error);
      if (requestId === activeRequestIdRef.current) {
        setLoadError("Unable to load profile details. Please try again.");
      }
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    activeAccountRemoteId,
    activeUserRemoteId,
    getAccountsByOwnerUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase,
    getBusinessProfileByAccountRemoteIdUseCase,
    onLoaded,
  ]);

  useEffect(() => {
    void reload();

    return () => {
      activeRequestIdRef.current += 1;
    };
  }, [reload]);

  return {
    isLoading,
    loadError,
    reload,
    setLoadError,
  };
};
