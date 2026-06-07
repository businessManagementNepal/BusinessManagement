import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, Circle } from "lucide-react-native";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { UserManagementPermission } from "../../types/userManagement.types";

export type PermissionModuleGroup = {
  module: string;
  permissions: UserManagementPermission[];
};

type PermissionModuleListProps = {
  permissionGroups: readonly PermissionModuleGroup[];
  selectedPermissionCodes: readonly string[];
  editable: boolean;
  disabled: boolean;
  onTogglePermission: (permissionCode: string) => void;
};

export function PermissionModuleList({
  permissionGroups,
  selectedPermissionCodes,
  editable,
  disabled,
  onTogglePermission,
}: PermissionModuleListProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <>
      {permissionGroups.map((permissionGroup) => (
        <Card key={permissionGroup.module} style={styles.permissionGroupWrap}>
          <Text style={styles.permissionGroupTitle}>{permissionGroup.module}</Text>

          {permissionGroup.permissions.map((permission) => {
            const isSelected = selectedPermissionCodes.includes(permission.code);
            const canToggle = editable && !disabled;

            const content = (
              <>
                <View style={styles.permissionToggleIconWrap}>
                  {isSelected ? (
                    <Check size={15} color={theme.colors.success} />
                  ) : (
                    <Circle size={15} color={theme.colors.mutedForeground} />
                  )}
                </View>
                <View style={styles.permissionRowTextWrap}>
                  <Text style={styles.permissionRowTitle}>{permission.label}</Text>
                  <Text style={styles.permissionRowSubtitle}>
                    {permission.description}
                  </Text>
                </View>
              </>
            );

            return canToggle ? (
              <Pressable
                key={permission.code}
                style={styles.permissionRow}
                onPress={() => onTogglePermission(permission.code)}
                accessibilityRole="button"
              >
                {content}
              </Pressable>
            ) : (
              <View key={permission.code} style={styles.permissionRow}>
                {content}
              </View>
            );
          })}
        </Card>
      ))}
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    permissionGroupWrap: {
      borderRadius: radius.md,
      padding: theme.scaleSpace(spacing.sm),
      gap: theme.scaleSpace(spacing.xs),
    },
    permissionGroupTitle: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(12),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    permissionRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.scaleSpace(spacing.xs),
      paddingVertical: theme.scaleSpace(4),
    },
    permissionToggleIconWrap: {
      width: theme.scaleSpace(20),
      alignItems: "center",
      paddingTop: theme.scaleSpace(2),
    },
    permissionRowTextWrap: {
      flex: 1,
    },
    permissionRowTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(12),
      fontFamily: "InterSemiBold",
    },
    permissionRowSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      marginTop: theme.scaleSpace(2),
      lineHeight: theme.scaleLineHeight(15),
    },
  });
