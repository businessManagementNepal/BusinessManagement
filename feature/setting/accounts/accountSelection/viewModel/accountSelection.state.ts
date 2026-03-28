import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  Account,
  AccountType,
  AccountTypeValue,
} from "../types/accountSelection.types";

export type AccountSelectionState = {
  accounts: Account[];
  selectedAccountRemoteId: string | null;
  activeUserRemoteId: string | null;
  isCreateMode: boolean;
  newAccountType: AccountTypeValue;
  newAccountDisplayName: string;
  isLoading: boolean;
  isSubmitting: boolean;
  submitError?: string;
  successMessage?: string;
};

export type AccountSelectionStateActions = {
  setAccounts: Dispatch<SetStateAction<Account[]>>;
  setSelectedAccountRemoteId: Dispatch<SetStateAction<string | null>>;
  setActiveUserRemoteId: Dispatch<SetStateAction<string | null>>;
  setIsCreateMode: Dispatch<SetStateAction<boolean>>;
  setNewAccountType: Dispatch<SetStateAction<AccountTypeValue>>;
  setNewAccountDisplayName: Dispatch<SetStateAction<string>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setSubmitError: Dispatch<SetStateAction<string | undefined>>;
  setSuccessMessage: Dispatch<SetStateAction<string | undefined>>;
  clearFeedback: () => void;
};

export const useAccountSelectionState = (): {
  state: AccountSelectionState;
  actions: AccountSelectionStateActions;
} => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountRemoteId, setSelectedAccountRemoteId] = useState<
    string | null
  >(null);
  const [activeUserRemoteId, setActiveUserRemoteId] = useState<string | null>(
    null,
  );
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [newAccountType, setNewAccountType] = useState<AccountTypeValue>(
    AccountType.Personal,
  );
  const [newAccountDisplayName, setNewAccountDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const clearFeedback = useCallback(() => {
    setSubmitError(undefined);
    setSuccessMessage(undefined);
  }, []);

  const state = useMemo<AccountSelectionState>(
    () => ({
      accounts,
      selectedAccountRemoteId,
      activeUserRemoteId,
      isCreateMode,
      newAccountType,
      newAccountDisplayName,
      isLoading,
      isSubmitting,
      submitError,
      successMessage,
    }),
    [
      accounts,
      selectedAccountRemoteId,
      activeUserRemoteId,
      isCreateMode,
      newAccountType,
      newAccountDisplayName,
      isLoading,
      isSubmitting,
      submitError,
      successMessage,
    ],
  );

  const actions = useMemo<AccountSelectionStateActions>(
    () => ({
      setAccounts,
      setSelectedAccountRemoteId,
      setActiveUserRemoteId,
      setIsCreateMode,
      setNewAccountType,
      setNewAccountDisplayName,
      setIsLoading,
      setIsSubmitting,
      setSubmitError,
      setSuccessMessage,
      clearFeedback,
    }),
    [clearFeedback],
  );

  return { state, actions };
};
