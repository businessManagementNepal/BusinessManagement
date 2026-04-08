import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { ArrowUpRight, FileText, Shield } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DataRightItem, TermsDocumentItem } from "../../types/settings.types";

type TermsPrivacyModalProps = {
  visible: boolean;
  items: readonly TermsDocumentItem[];
  dataRights: readonly DataRightItem[];
  onClose: () => void;
};

export function TermsPrivacyModal({
  visible,
  items,
  dataRights,
  onClose,
}: TermsPrivacyModalProps) {
  return (
    <FormSheetModal
      visible={visible}
      title="Terms & Privacy"
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
              <View style={styles.iconWrap}>
                {item.id === "privacy-policy" ? (
                  <Shield size={18} color={colors.primary} />
                ) : (
                  <FileText size={18} color={colors.primary} />
                )}
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              <ArrowUpRight size={16} color={colors.mutedForeground} />
            </Pressable>
          );
        })}
      </Card>

      <Card style={styles.dataRightsCard}>
        <Text style={styles.dataRightsTitle}>Your Data Rights</Text>
        {dataRights.map((item) => (
          <Text key={item.id} style={styles.dataRightItem}>
            • {item.label}
          </Text>
        ))}

        <AppButton label="Manage Data Preferences" variant="accent" size="md" style={styles.manageButton} disabled={true} />
      </Card>
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
    minHeight: 72,
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
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  rowTitle: {
    color: colors.cardForeground,
    fontSize: 15,
    fontFamily: "InterBold",
    marginBottom: 2,
  },
  rowSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterMedium",
  },
  dataRightsCard: {
    backgroundColor: colors.accent,
    gap: 8,
  },
  dataRightsTitle: {
    color: colors.cardForeground,
    fontSize: 16,
    fontFamily: "InterBold",
  },
  dataRightItem: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "InterMedium",
  },
  manageButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
});
