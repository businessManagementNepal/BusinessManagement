import {
  Contact,
  ContactBalanceDirection,
  getContactTypeLabel,
} from "@/feature/contacts/types/contact.types";
import {
  ContactDetailSummaryCardState,
  ContactDetailTimelineItemState,
} from "@/feature/contacts/types/contactDetails.state.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  emptyStateMessage: string | null;
  selectedContact: Contact | null;
  summaryCards: readonly ContactDetailSummaryCardState[];
  timelineItems: readonly ContactDetailTimelineItemState[];
  currencyPrefix: string;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
};

const formatPlainAmount = (amount: number): string =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

const buildOpeningBalanceLabel = (
  contact: Contact,
  currencyPrefix: string,
): string | null => {
  if (contact.openingBalanceAmount <= 0) {
    return null;
  }

  const amountLabel = `${currencyPrefix} ${formatPlainAmount(
    contact.openingBalanceAmount,
  )}`;

  if (contact.openingBalanceDirection === ContactBalanceDirection.Receive) {
    return `${amountLabel} - To Receive`;
  }

  if (contact.openingBalanceDirection === ContactBalanceDirection.Pay) {
    return `${amountLabel} - To Pay`;
  }

  return amountLabel;
};

const getSummaryToneColor = (
  theme: ReturnType<typeof useAppTheme>,
  tone: ContactDetailSummaryCardState["tone"],
): string => {
  if (tone === "positive") {
    return theme.colors.success;
  }

  if (tone === "negative") {
    return theme.colors.destructive;
  }

  return theme.colors.cardForeground;
};

const getTimelineAmountColor = (
  theme: ReturnType<typeof useAppTheme>,
  tone: ContactDetailTimelineItemState["amountTone"],
): string => {
  if (tone === "positive") {
    return theme.colors.success;
  }

  if (tone === "negative") {
    return theme.colors.destructive;
  }

  return theme.colors.cardForeground;
};

export function ContactDetailsModal({
  visible,
  isLoading,
  errorMessage,
  emptyStateMessage,
  selectedContact,
  summaryCards,
  timelineItems,
  currencyPrefix,
  canManage,
  onClose,
  onEdit,
}: Props): React.ReactElement {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const openingBalanceLabel = selectedContact
    ? buildOpeningBalanceLabel(selectedContact, currencyPrefix)
    : null;

  return (
    <FormSheetModal
      visible={visible}
      title={selectedContact?.fullName ?? "Contact Details"}
      subtitle="Linked billing, money, ledger, order, and POS history"
      onClose={onClose}
      closeAccessibilityLabel="Close contact details"
      presentation="bottom-sheet"
      footer={
        <FormModalActionFooter>
          <AppButton
            label="Close"
            variant="secondary"
            size="lg"
            style={styles.footerButton}
            onPress={onClose}
          />
          {canManage ? (
            <AppButton
              label="Edit Contact"
              size="lg"
              style={styles.footerButton}
              onPress={onEdit}
              disabled={!selectedContact}
            />
          ) : null}
        </FormModalActionFooter>
      }
    >
      {selectedContact ? (
        <Card>
          <View style={styles.headerTopRow}>
            <Text style={styles.contactName}>{selectedContact.fullName}</Text>
            {selectedContact.isArchived ? (
              <View style={styles.archivedBadge}>
                <Text style={styles.archivedBadgeText}>Archived</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.contactType}>
            {getContactTypeLabel(selectedContact.contactType)}
          </Text>

          <View style={styles.contactInfoGroup}>
            {selectedContact.phoneNumber ? (
              <Text style={styles.contactInfoLine}>
                Phone: {selectedContact.phoneNumber}
              </Text>
            ) : null}
            {selectedContact.emailAddress ? (
              <Text style={styles.contactInfoLine}>
                Email: {selectedContact.emailAddress}
              </Text>
            ) : null}
            {selectedContact.address ? (
              <Text style={styles.contactInfoLine}>
                Address: {selectedContact.address}
              </Text>
            ) : null}
            {selectedContact.taxId ? (
              <Text style={styles.contactInfoLine}>
                Tax ID: {selectedContact.taxId}
              </Text>
            ) : null}
            {openingBalanceLabel ? (
              <Text style={styles.contactInfoLine}>
                Opening Balance: {openingBalanceLabel}
              </Text>
            ) : null}
            {selectedContact.notes ? (
              <Text style={styles.contactInfoLine}>
                Notes: {selectedContact.notes}
              </Text>
            ) : null}
          </View>
        </Card>
      ) : null}

      <View style={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <Card key={card.id} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{card.label}</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: getSummaryToneColor(theme, card.tone) },
              ]}
            >
              {card.value}
            </Text>
          </Card>
        ))}
      </View>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>History</Text>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : null}

        {errorMessage ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load linked history</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          </Card>
        ) : null}

        {!isLoading && !errorMessage && emptyStateMessage ? (
          <Card>
            <Text style={styles.emptyText}>{emptyStateMessage}</Text>
          </Card>
        ) : null}

        {!isLoading && !errorMessage
          ? timelineItems.map((item) => (
              <Card key={item.id} style={styles.timelineCard}>
                <View style={styles.timelineHeaderRow}>
                  <View style={styles.eventBadge}>
                    <Text style={styles.eventBadgeText}>{item.eventLabel}</Text>
                  </View>
                  <Text style={styles.happenedAtText}>{item.happenedAtLabel}</Text>
                </View>

                <View style={styles.timelineBodyRow}>
                  <View style={styles.timelineTextWrap}>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={styles.timelineSubtitle}>{item.subtitle}</Text>
                    ) : null}
                    {item.statusLabel ? (
                      <Text style={styles.timelineStatus}>
                        Status: {item.statusLabel}
                      </Text>
                    ) : null}
                  </View>

                  {item.amountLabel ? (
                    <Text
                      style={[
                        styles.timelineAmount,
                        {
                          color: getTimelineAmountColor(theme, item.amountTone),
                        },
                      ]}
                    >
                      {item.amountLabel}
                    </Text>
                  ) : null}
                </View>
              </Card>
            ))
          : null}
      </View>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    footerButton: {
      flex: 1,
    },
    headerTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    contactName: {
      flex: 1,
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(18),
      lineHeight: theme.scaleLineHeight(22),
      fontFamily: "InterBold",
    },
    archivedBadge: {
      paddingHorizontal: theme.scaleSpace(10),
      paddingVertical: theme.scaleSpace(4),
      borderRadius: radius.pill,
      backgroundColor: theme.colors.accent,
    },
    archivedBadgeText: {
      color: theme.colors.accentForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterBold",
    },
    contactType: {
      marginTop: theme.scaleSpace(spacing.xs),
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    contactInfoGroup: {
      marginTop: theme.scaleSpace(spacing.sm),
      gap: theme.scaleSpace(6),
    },
    contactInfoLine: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterMedium",
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.scaleSpace(spacing.sm),
    },
    summaryCard: {
      width: "47%",
    },
    summaryLabel: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    summaryValue: {
      marginTop: theme.scaleSpace(6),
      fontSize: theme.scaleText(16),
      lineHeight: theme.scaleLineHeight(20),
      fontFamily: "InterBold",
    },
    sectionWrap: {
      gap: theme.scaleSpace(spacing.sm),
    },
    sectionTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(16),
      lineHeight: theme.scaleLineHeight(20),
      fontFamily: "InterBold",
    },
    loadingWrap: {
      paddingVertical: theme.scaleSpace(spacing.md),
      alignItems: "center",
    },
    errorCard: {
      backgroundColor: theme.isDarkMode ? "rgba(228, 71, 71, 0.12)" : "#FFF6F6",
      borderColor: theme.isDarkMode ? "rgba(228, 71, 71, 0.25)" : "#F4D0D0",
    },
    errorTitle: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(14),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterBold",
    },
    errorMessage: {
      marginTop: theme.scaleSpace(6),
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    emptyText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    timelineCard: {
      gap: theme.scaleSpace(spacing.sm),
    },
    timelineHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
    },
    eventBadge: {
      paddingHorizontal: theme.scaleSpace(10),
      paddingVertical: theme.scaleSpace(4),
      borderRadius: radius.pill,
      backgroundColor: theme.colors.accent,
      alignSelf: "flex-start",
    },
    eventBadgeText: {
      color: theme.colors.accentForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
    },
    happenedAtText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    timelineBodyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: theme.scaleSpace(spacing.sm),
    },
    timelineTextWrap: {
      flex: 1,
      gap: theme.scaleSpace(4),
    },
    timelineTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterBold",
    },
    timelineSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    timelineStatus: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    timelineAmount: {
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterBold",
    },
  });
