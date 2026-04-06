import React, { useEffect, useMemo, useState } from "react";
import { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import { SaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase";
import { ArchiveContactUseCase } from "@/feature/contacts/useCase/archiveContact.useCase";
import { useContactsViewModel } from "@/feature/contacts/viewModel/contacts.viewModel.impl";
import { ContactsScreen } from "@/feature/contacts/ui/ContactsScreen";
import { createLocalContactDatasource } from "@/feature/contacts/data/dataSource/local.contact.datasource.impl";
import { createContactRepository } from "@/feature/contacts/data/repository/contact.repository.impl";
import { createGetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase.impl";
import { createSaveContactUseCase } from "@/feature/contacts/useCase/saveContact.useCase.impl";
import { createArchiveContactUseCase } from "@/feature/contacts/useCase/archiveContact.useCase.impl";
import {
  Account,
  AccountTypeValue,
} from "@/feature/auth/accountSelection/types/accountSelection.types";
import { createLocalAccountDatasource } from "@/feature/auth/accountSelection/data/dataSource/local.account.datasource.impl";
import { createAccountRepository } from "@/feature/auth/accountSelection/data/repository/account.repository.impl";
import { createGetAccessibleAccountsByUserRemoteIdUseCase } from "@/feature/auth/accountSelection/useCase/getAccessibleAccountsByUserRemoteId.useCase.impl";
import { createLocalUserManagementDatasource } from "@/feature/userManagement/data/dataSource/local.userManagement.datasource.impl";
import { createUserManagementRepository } from "@/feature/userManagement/data/repository/userManagement.repository.impl";
import { createLocalAuthUserDatasource } from "@/feature/session/data/dataSource/local.authUser.datasource.impl";
import { createAuthUserRepository } from "@/feature/session/data/repository/authUser.repository.impl";
import appDatabase from "@/shared/database/appDatabase";

type GetContactsScreenFactoryProps = {
  activeUserRemoteId: string | null;
  activeAccountRemoteId: string | null;
  activeAccountType: AccountTypeValue | null;
  activeAccountCurrencyCode: string | null;
  activeAccountCountryCode: string | null;
  canManage: boolean;
};

export function GetContactsScreenFactory({
  activeUserRemoteId,
  activeAccountRemoteId,
  activeAccountType,
  activeAccountCurrencyCode,
  activeAccountCountryCode,
  canManage,
}: GetContactsScreenFactoryProps): React.ReactElement {
  const [accounts, setAccounts] = useState<readonly Account[]>([]);

  const accountDatasource = useMemo(
    () => createLocalAccountDatasource(appDatabase),
    [],
  );
  const accountRepository = useMemo(
    () => createAccountRepository(accountDatasource),
    [accountDatasource],
  );
  const authUserDatasource = useMemo(
    () => createLocalAuthUserDatasource(appDatabase),
    [],
  );
  const authUserRepository = useMemo(
    () => createAuthUserRepository(authUserDatasource),
    [authUserDatasource],
  );
  const userManagementDatasource = useMemo(
    () => createLocalUserManagementDatasource(appDatabase),
    [],
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

  const contactDatasource = useMemo(
    () => createLocalContactDatasource(appDatabase),
    [],
  );
  const contactRepository = useMemo(
    () => createContactRepository(contactDatasource),
    [contactDatasource],
  );
  const getContactsUseCase: GetContactsUseCase = useMemo(
    () => createGetContactsUseCase(contactRepository),
    [contactRepository],
  );
  const saveContactUseCase: SaveContactUseCase = useMemo(
    () => createSaveContactUseCase(contactRepository),
    [contactRepository],
  );
  const archiveContactUseCase: ArchiveContactUseCase = useMemo(
    () => createArchiveContactUseCase(contactRepository),
    [contactRepository],
  );

  useEffect(() => {
    let isMounted = true;

    const loadAccounts = async () => {
      if (!activeUserRemoteId) {
        if (isMounted) {
          setAccounts([]);
        }
        return;
      }

      const result = await getAccessibleAccountsByUserRemoteIdUseCase.execute(
        activeUserRemoteId,
      );

      if (!isMounted) {
        return;
      }

      if (!result.success) {
        setAccounts([]);
        return;
      }

      setAccounts(result.value);
    };

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [activeUserRemoteId, getAccessibleAccountsByUserRemoteIdUseCase]);

  const activeAccount = useMemo(
    () =>
      accounts.find((account) => account.remoteId === activeAccountRemoteId) ?? null,
    [accounts, activeAccountRemoteId],
  );

  const viewModel = useContactsViewModel({
    ownerUserRemoteId: activeUserRemoteId,
    accountRemoteId: activeAccountRemoteId,
    accountType: activeAccountType,
    canManage,
    currencyCode: activeAccount?.currencyCode ?? activeAccountCurrencyCode,
    countryCode: activeAccount?.countryCode ?? activeAccountCountryCode,
    getContactsUseCase,
    saveContactUseCase,
    archiveContactUseCase,
  });

  return <ContactsScreen viewModel={viewModel} />;
}
