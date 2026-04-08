import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { ChevronRight, CircleHelp, Mail, Phone } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { HelpFaqItem, SupportContactItem } from "../../types/settings.types";

type HelpFaqModalProps = {
  visible: boolean;
  items: readonly HelpFaqItem[];
  supportContacts: readonly SupportContactItem[];
  onClose: () => void;
};

export function HelpFaqModal({
  visible,
  items,
  supportContacts,
  onClose,
}: HelpFaqModalProps) {
  return (
    <FormSheetModal
      visible={visible}
      title="Help & FAQ"
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
    >
      <Card style={styles.listCard}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Pressable
              key={item.id}
              style={[styles.row, !isLast ? styles.rowBorder : null]}
              accessibilityRole="button"
            >
              <Text style={styles.rowTitle}>{item.question}</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </Pressable>
          );
        })}
      </Card>

      <View style={styles.sectionWrap}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Card style={styles.listCard}>
          {supportContacts.map((item, index) => {
            const isLast = index === supportContacts.length - 1;
            const Icon = item.id === "phone" ? Phone : Mail;

            return (
              <View key={item.id} style={[styles.contactRow, !isLast ? styles.rowBorder : null]}>
                <View style={styles.contactIconWrap}>
                  <Icon size={18} color={colors.primary} />
                </View>
                <View style={styles.contactTextWrap}>
                  <Text style={styles.contactTitle}>{item.title}</Text>
                  <Text style={styles.contactValue}>{item.value}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      </View>

      <View style={styles.infoWrap}>
        <CircleHelp size={16} color={colors.mutedForeground} />
        <Text style={styles.infoText}>
          FAQ answers were not available in the current codebase, so this build preserves the question list and support contacts from the provided UI.
        </Text>
      </View>
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  listCard: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    flex: 1,
    color: colors.cardForeground,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "InterSemiBold",
  },
  sectionWrap: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterBold",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  contactRow: {
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  contactIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  contactTextWrap: {
    flex: 1,
  },
  contactTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  contactValue: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterMedium",
  },
  infoWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  infoText: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterMedium",
  },
});
