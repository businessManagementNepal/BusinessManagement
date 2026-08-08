import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { ArrowUpRight, FileText, Shield, Trash2 } from "lucide-react-native";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { DataRightItem, TermsDocumentItem } from "../../types/settings.types";

type TermsPrivacyModalProps = {
  visible: boolean;
  items: readonly TermsDocumentItem[];
  dataRights: readonly DataRightItem[];
  onDeleteLocalData: () => void;
  onClose: () => void;
};

const openLink = async (href: string): Promise<void> => {
  try {
    await Linking.openURL(href);
  } catch (error) {
    console.error("Failed to open legal or privacy link.", error);
  }
};

export function TermsPrivacyModal({
  visible,
  items,
  dataRights,
  onDeleteLocalData,
  onClose,
}: TermsPrivacyModalProps) {
  const theme = useAppTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: theme.scaleSpace(spacing.md),
        },
        listCard: {
          padding: 0,
          overflow: "hidden",
        },
        row: {
          minHeight: theme.scaleSpace(72),
          paddingHorizontal: theme.scaleSpace(spacing.md),
          paddingVertical: theme.scaleSpace(spacing.md),
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(spacing.sm),
        },
        rowBorder: {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        iconWrap: {
          width: theme.scaleSpace(38),
          height: theme.scaleSpace(38),
          borderRadius: radius.pill,
          backgroundColor: theme.colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        textWrap: {
          flex: 1,
        },
        rowTitle: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(15),
          fontFamily: "InterBold",
          marginBottom: 2,
        },
        rowSubtitle: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(17),
          fontFamily: "InterMedium",
        },
        dataRightsCard: {
          backgroundColor: theme.colors.accent,
          gap: theme.scaleSpace(8),
        },
        dataRightsTitle: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(16),
          fontFamily: "InterBold",
        },
        dataRightRow: {
          gap: 4,
          paddingVertical: theme.scaleSpace(2),
        },
        dataRightLabel: {
          color: theme.colors.cardForeground,
          fontSize: theme.scaleText(13),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterSemiBold",
        },
        dataRightDescription: {
          color: theme.colors.mutedForeground,
          fontSize: theme.scaleText(12),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterMedium",
        },
        dataRightAction: {
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(6),
          paddingTop: theme.scaleSpace(2),
        },
        dataRightActionLabel: {
          color: theme.colors.primary,
          fontSize: theme.scaleText(12),
          fontFamily: "InterSemiBold",
        },
        destructiveDataRightRow: {
          borderWidth: 1,
          borderColor: theme.colors.destructive,
          borderRadius: radius.lg,
          padding: theme.scaleSpace(spacing.sm),
          backgroundColor: theme.colors.card,
        },
        destructiveHeading: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.scaleSpace(6),
        },
        destructiveLabel: {
          flex: 1,
          color: theme.colors.destructive,
          fontSize: theme.scaleText(13),
          lineHeight: theme.scaleLineHeight(18),
          fontFamily: "InterBold",
        },
        destructiveActionLabel: {
          color: theme.colors.destructive,
          fontSize: theme.scaleText(12),
          fontFamily: "InterBold",
        },
      }),
    [theme],
  );

  return (
    <FormSheetModal
      visible={visible}
      title="Data & Privacy"
      onClose={onClose}
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
    >
      <Card style={styles.listCard}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Pressable
              key={item.id}
              style={[styles.row, !isLast ? styles.rowBorder : null]}
              accessibilityRole={item.href ? "button" : "text"}
              onPress={
                item.href
                  ? () => {
                      void openLink(item.href!);
                    }
                  : undefined
              }
            >
              <View style={styles.iconWrap}>
                {item.id === "privacy-policy" ? (
                  <Shield size={18} color={theme.colors.primary} />
                ) : (
                  <FileText size={18} color={theme.colors.primary} />
                )}
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              </View>
              {item.href ? (
                <ArrowUpRight size={16} color={theme.colors.mutedForeground} />
              ) : null}
            </Pressable>
          );
        })}
      </Card>

      <Card style={styles.dataRightsCard}>
        <Text style={styles.dataRightsTitle}>Your Data &amp; Privacy</Text>
        {dataRights.map((item) => {
          if (item.id === "delete-profile-data") {
            return (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.dataRightRow,
                  styles.destructiveDataRightRow,
                  pressed ? { opacity: 0.88 } : null,
                ]}
                onPress={onDeleteLocalData}
                accessibilityRole="button"
                accessibilityLabel="Delete Profile & All Data"
              >
                <View style={styles.destructiveHeading}>
                  <Trash2 size={16} color={theme.colors.destructive} />
                  <Text style={styles.destructiveLabel}>{item.label}</Text>
                </View>
                {item.description ? (
                  <Text style={styles.dataRightDescription}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={styles.destructiveActionLabel}>
                  Review permanent deletion
                </Text>
              </Pressable>
            );
          }

          return (
            <View key={item.id} style={styles.dataRightRow}>
              <Text style={styles.dataRightLabel}>{item.label}</Text>
              {item.description ? (
                <Text style={styles.dataRightDescription}>
                  {item.description}
                </Text>
              ) : null}
              {item.href && item.actionLabel ? (
                <Pressable
                  style={styles.dataRightAction}
                  onPress={() => {
                    void openLink(item.href!);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={styles.dataRightActionLabel}>
                    {item.actionLabel}
                  </Text>
                  <ArrowUpRight size={14} color={theme.colors.primary} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </Card>
    </FormSheetModal>
  );
}
