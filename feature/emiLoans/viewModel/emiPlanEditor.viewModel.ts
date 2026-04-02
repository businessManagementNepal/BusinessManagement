import {
  EmiPlanModeValue,
  EmiPlanTypeValue,
} from "@/feature/emiLoans/types/emi.entity.types";
import { EmiPlanEditorState } from "@/feature/emiLoans/types/emi.state.types";

export interface EmiPlanEditorViewModel {
  state: EmiPlanEditorState;
  availablePlanTypes: readonly { value: EmiPlanTypeValue; label: string }[];
  accountLabel: string;
  openCreate: () => void;
  close: () => void;
  onChangePlanType: (value: EmiPlanTypeValue) => void;
  onChangeTitle: (value: string) => void;
  onChangeCounterpartyName: (value: string) => void;
  onChangeCounterpartyPhone: (value: string) => void;
  onChangeTotalAmount: (value: string) => void;
  onChangeInstallmentCount: (value: string) => void;
  onChangeFirstDueAt: (value: string) => void;
  onToggleReminder: () => void;
  onChangeReminderDaysBefore: (value: string) => void;
  onChangeNote: (value: string) => void;
  submit: () => Promise<void>;
}
