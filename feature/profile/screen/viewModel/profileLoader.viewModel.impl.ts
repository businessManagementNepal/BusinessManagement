import { AccountType } from "@/feature/auth/accountSelection/types/accountSelection.types";
import {
    createDefaultBusinessProfileForm,
    createEmptyPersonalProfile,
    mapAccountOptionToFallbackBusinessForm,
    mapBusinessProfileToForm,
} from "@/feature/profile/screen/viewModel/profileScreen.shared";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ProfileLoaderViewModel,
    UseProfileLoaderViewModelParams,
} from "./profileLoader.viewModel";

const resolveEstablishedYear = (
  timestamp: number | null | undefined,
): string => {
  if (!timestamp) {
    return "";
  }

  const dateValue = new Date(timestamp);
  if (Number.isNaN(dateValue.getTime())) {
    return "";
  }

  return String(dateValue.getFullYear());
};

export const useProfileLoaderViewModel = (
  params: UseProfileLoaderViewModelParams,
): ProfileLoaderViewModel => {
  const {
    activeUserRemoteId,
    activeAccountRemoteId,
    getAccessibleAccountsByUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase,
    getBusinessProfileByAccountRemoteIdUseCase,
    getUserManagementSnapshotUseCase,
    onLoaded,
  } = params;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const activeRequestIdRef = useRef(0);

  const reload = useCallback(async (): Promise<void> => {
    const requestId = ++activeRequestIdRef.current;
    setIsLoading(true);
    setLoadError(null);

    try {
      if (!activeUserRemoteId) {
        if (requestId === activeRequestIdRef.current) {
          setLoadError("Active user session not found.");
        }
        return;
      }

      const [userResult, accountsResult] = await Promise.all([
        getAuthUserByRemoteIdUseCase.execute(activeUserRemoteId),
        getAccessibleAccountsByUserRemoteIdUseCase.execute(activeUserRemoteId),
      ]);

      if (!accountsResult.success) {
        if (requestId === activeRequestIdRef.current) {
          setLoadError(accountsResult.error.message);
        }
        return;
      }

      const accountOptions = accountsResult.value.map((account) => ({
        remoteId: account.remoteId,
        ownerUserRemoteId: account.ownerUserRemoteId,
        createdAt: account.createdAt,
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
            profileImageUrl: userResult.value.profileImageUrl ?? "",
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
            isActiveAccountOwner: false,
            activeAccountDisplayName: "",
            activeBusinessEstablishedYear: "",
            activeAccountRoleLabel: "",
            grantedPermissionCodes: [],
            personalProfile,
            activeBusinessProfile: createDefaultBusinessProfileForm(),
            hasActiveBusinessProfile: false,
          });

          setLoadError(
            "Active account not found. Please select account again.",
          );
        }
        return;
      }

      let activeBusinessProfile = createDefaultBusinessProfileForm();
      let hasActiveBusinessProfile = false;
      let activeBusinessEstablishedYear = resolveEstablishedYear(
        activeAccount.createdAt,
      );
      let activeAccountRoleLabel =
        activeAccount.accountType === AccountType.Business
          ? "Business Owner"
          : "Personal Account";
      let grantedPermissionCodes: string[] = [];

      if (activeAccount.accountType === AccountType.Business) {
        const [businessProfileResult, userManagementSnapshotResult] =
          await Promise.all([
            getBusinessProfileByAccountRemoteIdUseCase.execute(
              activeAccount.remoteId,
            ),
            getUserManagementSnapshotUseCase.execute({
              accountRemoteId: activeAccount.remoteId,
              userRemoteId: activeUserRemoteId,
            }),
          ]);

        if (businessProfileResult.success) {
          activeBusinessProfile = mapBusinessProfileToForm(
            businessProfileResult.value,
          );
          hasActiveBusinessProfile = true;
          activeBusinessEstablishedYear = resolveEstablishedYear(
            businessProfileResult.value.createdAt,
          );
        } else {
          activeBusinessProfile =
            mapAccountOptionToFallbackBusinessForm(activeAccount);
        }

        if (userManagementSnapshotResult.success) {
          const activeMember = userManagementSnapshotResult.value.members.find(
            (member) => member.userRemoteId === activeUserRemoteId,
          );

          activeAccountRoleLabel =
            activeMember?.roleName ?? activeAccountRoleLabel;
          grantedPermissionCodes = [
            ...userManagementSnapshotResult.value.grantedPermissionCodes,
          ];
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
          isActiveAccountOwner:
            activeAccount.ownerUserRemoteId === activeUserRemoteId,
          activeAccountDisplayName: activeAccount.displayName,
          activeBusinessEstablishedYear,
          activeAccountRoleLabel,
          grantedPermissionCodes,
          personalProfile,
          activeBusinessProfile,
          hasActiveBusinessProfile,
        });
      }
    } catch {
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
    getAccessibleAccountsByUserRemoteIdUseCase,
    getAuthUserByRemoteIdUseCase,
    getBusinessProfileByAccountRemoteIdUseCase,
    getUserManagementSnapshotUseCase,
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
