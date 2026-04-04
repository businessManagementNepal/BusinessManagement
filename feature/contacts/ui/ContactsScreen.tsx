import {
  ContactBalanceDirection,
  getContactTypeLabel,
} from "@/feature/contacts/types/contact.types";
import { ContactsViewModel } from "@/feature/contacts/viewModel/contacts.viewModel";
import { DashboardTabScaffold } from "@/feature/dashboard/shared/ui/DashboardTabScaffold";
import { buildInitials } from "@/feature/dashboard/shared/utils/dashboardNavigation.util";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { StatCard } from "@/shared/components/reusable/Cards/StatCard";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { SearchInputRow } from "@/shared/components/reusable/Form/SearchInputRow";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Plus } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ContactEditorModal } from "./components/ContactEditorModal";

const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);
};

type ContactsScreenProps = {
  viewModel: ContactsViewModel;
};

export function ContactsScreen({
  viewModel,
}: ContactsScreenProps) {
  return (
    <>
      <DashboardTabScaffold
        footer={
          <BottomTabAwareFooter>
            <AppButton
              label="Add Contact"
              size="lg"
              leadingIcon={<Plus size={18} color={colors.primaryForeground} />}
              onPress={viewModel.onOpenCreate}
              disabled={!viewModel.canManage}
            />
          </BottomTabAwareFooter>
        }
        baseBottomPadding={140}
        contentContainerStyle={null}
        showDivider={false}
      >
        <View style={styles.summaryRow}>
          <StatCard
            icon={<Text style={styles.statIcon}>#</Text>}
            value={String(viewModel.summary.totalCount)}
            label="Total"
          />
          <StatCard
            icon={<Text style={styles.statIcon}>{viewModel.currencyPrefix}</Text>}
            value={viewModel.summary.receiveAmountLabel}
            label="Receivable"
            valueColor={colors.success}
          />
          <StatCard
            icon={<Text style={styles.statIcon}>{viewModel.currencyPrefix}</Text>}
            value={viewModel.summary.payAmountLabel}
            label="Payable"
            valueColor={colors.destructive}
          />
        </View>

        <SearchInputRow
          value={viewModel.searchQuery}
          onChangeText={viewModel.onSearchChange}
          placeholder="Search contacts..."
        />

        <FilterChipGroup
          options={viewModel.filterOptions}
          selectedValue={viewModel.selectedFilter}
          onSelect={viewModel.onFilterChange}
        />

        {viewModel.errorMessage ? (
          <Text style={styles.errorText}>{viewModel.errorMessage}</Text>
        ) : null}
        {viewModel.isLoading ? <ActivityIndicator color={colors.primary} /> : null}

        <Card style={styles.listCard}>
          {viewModel.filteredContacts.length === 0 ? (
            <Text style={styles.emptyText}>
              No contacts available yet. Add your first contact to get started.
            </Text>
          ) : (
            viewModel.filteredContacts.map((contact, index) => {
              const isLast = index === viewModel.filteredContacts.length - 1;
              const amountTone = viewModel.getContactAmountTone(contact);
              const amountLabel = contact.openingBalanceAmount
                ? formatAmount(contact.openingBalanceAmount)
                : null;

              return (
                <Pressable
                  key={contact.remoteId}
                  style={[styles.row, !isLast ? styles.rowBorder : null]}
                  onPress={() => viewModel.onOpenEdit(contact)}
                  disabled={!viewModel.canManage}
                >
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>
                      {buildInitials(contact.fullName).slice(0, 1)}
                    </Text>
                  </View>

                  <View style={styles.textWrap}>
                    <Text style={styles.rowTitle}>{contact.fullName}</Text>
                    <Text style={styles.rowSubtitle}>
                      {getContactTypeLabel(contact.contactType)}
                      {contact.phoneNumber ? ` - ${contact.phoneNumber}` : ""}
                    </Text>
                  </View>

                  <View style={styles.amountWrap}>
                    {amountLabel ? (
                      <>
                        <Text
                          style={[
                            styles.amountText,
                            amountTone === ContactBalanceDirection.Receive
                              ? styles.receiveValue
                              : styles.payValue,
                          ]}
                        >
                          {viewModel.currencyPrefix} {amountLabel}
                        </Text>
                        <Text style={styles.amountCaption}>
                          {amountTone === ContactBalanceDirection.Receive
                            ? "To Receive"
                            : "To Pay"}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          )}
        </Card>
      </DashboardTabScaffold>

      <ContactEditorModal
        visible={viewModel.isEditorVisible}
        title={viewModel.editorTitle}
        form={viewModel.form}
        typeOptions={viewModel.typeOptions}
        onClose={viewModel.onCloseEditor}
        onChange={viewModel.onFormChange}
        onSubmit={viewModel.onSubmit}
        openingBalancePlaceholder={viewModel.openingBalancePlaceholder}
        disableSubmit={!viewModel.canManage}
      />
    </>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statIcon: {
    color: colors.primary,
    fontFamily: "InterBold",
    fontSize: 18,
  },
  listCard: {
    paddingVertical: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 20,
    fontFamily: "InterBold",
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  rowSubtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  amountWrap: {
    alignItems: "flex-end",
    minWidth: 84,
  },
  amountText: {
    fontSize: 14,
    fontFamily: "InterBold",
  },
  amountCaption: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
    marginTop: 2,
  },
  receiveValue: {
    color: colors.success,
  },
  payValue: {
    color: colors.destructive,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
});
