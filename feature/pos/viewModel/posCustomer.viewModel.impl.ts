import type { Contact } from "@/feature/contacts/types/contact.types";
import { ContactType } from "@/feature/contacts/types/contact.types";
import type { GetContactsUseCase } from "@/feature/contacts/useCase/getContacts.useCase";
import type { GetOrCreateBusinessContactUseCase } from "@/feature/contacts/useCase/getOrCreateBusinessContact.useCase";
import React, { useCallback, useMemo, useRef } from "react";
import type { PosCustomer } from "../types/pos.entity.types";
import type { PosScreenCoordinatorState } from "../types/pos.state.types";
import { POS_DEFAULT_CUSTOMER_SEARCH_LIMIT } from "../types/pos.constant";
import type { PosSessionStateOverrides } from "./internal/posScreen.shared";
import type { PosCustomerViewModel } from "./posCustomer.viewModel";

interface UsePosCustomerViewModelParams {
  state: PosScreenCoordinatorState;
  setState: React.Dispatch<React.SetStateAction<PosScreenCoordinatorState>>;
  activeBusinessAccountRemoteId: string | null;
  activeOwnerUserRemoteId: string | null;
  getContactsUseCase: GetContactsUseCase;
  getOrCreateBusinessContactUseCase: GetOrCreateBusinessContactUseCase;
  saveCurrentSession: (
    overrides?: PosSessionStateOverrides,
  ) => Promise<void>;
}

export function usePosCustomerViewModel({
  state,
  setState,
  activeBusinessAccountRemoteId,
  activeOwnerUserRemoteId,
  getContactsUseCase,
  getOrCreateBusinessContactUseCase,
  saveCurrentSession,
}: UsePosCustomerViewModelParams): PosCustomerViewModel {
  const customerSearchRequestRef = useRef(0);

  const onSelectCustomer = useCallback(
    (customer: PosCustomer) => {
      setState((currentState) => ({
        ...currentState,
        selectedCustomer: customer,
        customerSearchTerm: "",
        customerOptions: [],
        errorMessage: null,
      }));
      void saveCurrentSession({ selectedCustomer: customer });
    },
    [saveCurrentSession, setState],
  );

  const onClearCustomer = useCallback(() => {
    customerSearchRequestRef.current += 1;
    setState((currentState) => ({
      ...currentState,
      selectedCustomer: null,
      customerSearchTerm: "",
      customerOptions: [],
      errorMessage: null,
    }));
    void saveCurrentSession({ selectedCustomer: null });
  }, [saveCurrentSession, setState]);

  const onCustomerSearchChange = useCallback(
    (value: string) => {
      const trimmedValue = value.trim();

      setState((currentState) => ({
        ...currentState,
        customerSearchTerm: value,
        errorMessage: null,
      }));

      if (!activeBusinessAccountRemoteId || trimmedValue === "") {
        customerSearchRequestRef.current += 1;
        setState((currentState) => ({
          ...currentState,
          customerOptions: [],
        }));
        return;
      }

      const requestId = ++customerSearchRequestRef.current;
      const searchTerm = trimmedValue.toLowerCase();

      void (async () => {
        try {
          const result = await getContactsUseCase.execute({
            accountRemoteId: activeBusinessAccountRemoteId,
          });
          if (requestId !== customerSearchRequestRef.current) {
            return;
          }

          if (!result.success) {
            setState((currentState) => ({
              ...currentState,
              customerOptions: [],
              errorMessage: result.error.message,
            }));
            return;
          }

          const customerOptions = result.value
            .filter(
              (contact: Contact) => contact.contactType === ContactType.Customer,
            )
            .filter((contact: Contact) => {
              const nameMatch = contact.fullName
                .toLowerCase()
                .includes(searchTerm);
              const phoneMatch =
                contact.phoneNumber?.toLowerCase().includes(searchTerm) ?? false;

              return nameMatch || phoneMatch;
            })
            .slice(0, POS_DEFAULT_CUSTOMER_SEARCH_LIMIT)
            .map((contact: Contact) => ({
              label:
                contact.fullName +
                (contact.phoneNumber ? ` - ${contact.phoneNumber}` : ""),
              value: contact.remoteId,
              customerData: {
                remoteId: contact.remoteId,
                fullName: contact.fullName,
                phone: contact.phoneNumber,
                address: contact.address,
              },
            }));

          setState((currentState) => ({
            ...currentState,
            customerOptions,
          }));
        } catch (error) {
          if (requestId !== customerSearchRequestRef.current) {
            return;
          }
          setState((currentState) => ({
            ...currentState,
            customerOptions: [],
            errorMessage:
              error instanceof Error
                ? error.message
                : "Failed to search customers",
          }));
        }
      })();
    },
    [activeBusinessAccountRemoteId, getContactsUseCase, setState],
  );

  const onOpenCustomerCreateModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "customer-create",
      customerCreateForm: {
        fullName: "",
        phone: "",
        address: "",
      },
    }));
  }, [setState]);

  const onCloseCustomerCreateModal = useCallback(() => {
    setState((currentState) => ({
      ...currentState,
      activeModal: "none",
      customerCreateForm: {
        fullName: "",
        phone: "",
        address: "",
      },
    }));
  }, [setState]);

  const onCustomerCreateFormChange = useCallback(
    (field: "fullName" | "phone" | "address", value: string) => {
      setState((currentState) => ({
        ...currentState,
        customerCreateForm: {
          ...currentState.customerCreateForm,
          [field]: value,
        },
      }));
    },
    [setState],
  );

  const onCreateCustomer = useCallback(async () => {
    const { fullName, phone, address } = state.customerCreateForm;
    if (!fullName.trim()) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Customer name is required.",
      }));
      return;
    }

    if (!activeBusinessAccountRemoteId || !activeOwnerUserRemoteId) {
      setState((currentState) => ({
        ...currentState,
        errorMessage: "Business context is required for customer creation.",
      }));
      return;
    }

    setState((currentState) => ({
      ...currentState,
      isCreatingCustomer: true,
      errorMessage: null,
    }));

    const result = await getOrCreateBusinessContactUseCase.execute({
      accountRemoteId: activeBusinessAccountRemoteId,
      contactType: "customer",
      fullName: fullName.trim(),
      ownerUserRemoteId: activeOwnerUserRemoteId,
      phoneNumber: phone.trim() || null,
      address: address.trim() || null,
      notes: null,
    });

    if (!result.success) {
      setState((currentState) => ({
        ...currentState,
        isCreatingCustomer: false,
        errorMessage: result.error.message,
      }));
      return;
    }

    const newCustomer: PosCustomer = {
      remoteId: result.value.remoteId,
      fullName: result.value.fullName,
      phone: result.value.phoneNumber,
      address: result.value.address,
    };

    setState((currentState) => ({
      ...currentState,
      selectedCustomer: newCustomer,
      activeModal: "none",
      customerCreateForm: {
        fullName: "",
        phone: "",
        address: "",
      },
      isCreatingCustomer: false,
      errorMessage: null,
      infoMessage: `Customer "${fullName}" created and selected successfully.`,
    }));

    await saveCurrentSession({
      selectedCustomer: newCustomer,
    });
  }, [
    activeBusinessAccountRemoteId,
    activeOwnerUserRemoteId,
    getOrCreateBusinessContactUseCase,
    saveCurrentSession,
    setState,
    state.customerCreateForm,
  ]);

  return useMemo(
    () => ({
      selectedCustomer: state.selectedCustomer,
      customerSearchTerm: state.customerSearchTerm,
      customerOptions: state.customerOptions,
      customerCreateForm: state.customerCreateForm,
      isCustomerCreateModalVisible: state.activeModal === "customer-create",
      isCreatingCustomer: state.isCreatingCustomer,
      onSelectCustomer,
      onClearCustomer,
      onCustomerSearchChange,
      onOpenCustomerCreateModal,
      onCloseCustomerCreateModal,
      onCustomerCreateFormChange,
      onCreateCustomer,
    }),
    [
      onClearCustomer,
      onCloseCustomerCreateModal,
      onCreateCustomer,
      onCustomerCreateFormChange,
      onCustomerSearchChange,
      onOpenCustomerCreateModal,
      onSelectCustomer,
      state.activeModal,
      state.customerCreateForm,
      state.customerOptions,
      state.customerSearchTerm,
      state.isCreatingCustomer,
      state.selectedCustomer,
    ],
  );
}
