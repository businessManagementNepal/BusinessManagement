import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { FormModalActionFooter } from "@/shared/components/reusable/Form/FormModalActionFooter";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { Check, CircleDashed } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { UserManagementPermission } from "../../types/userManagement.types";
import { UserManagementRoleEditorFieldErrors } from "@/feature/userManagement/viewModel/userManagement.state";

export type RoleEditorPermissionGroup = {
  module: string;
  permissions: UserManagementPermission[];
};

type RoleEditorModalProps = {
  visible: boolean;
  mode: "create" | "edit";
  roleName: string;
  selectedPermissionCodes: readonly string[];
  permissionGroups: readonly RoleEditorPermissionGroup[];
  fieldErrors: UserManagementRoleEditorFieldErrors;
  isSaving: boolean;
  onRoleNameChange: (roleName: string) => void;
  onTogglePermission: (permissionCode: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function RoleEditorModal({
  visible,
  mode,
  roleName,
  selectedPermissionCodes,
  permissionGroups,
  fieldErrors,
  isSaving,
  onRoleNameChange,
  onTogglePermission,
  onCancel,
  onSave,
}: RoleEditorModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const modalTitle = mode === "create" ? "Create Role" : "Edit Role";

  return (
    <FormSheetModal
      visible={visible}
      title={modalTitle}
      subtitle="Set role name and permissions"
      onClose={onCancel}
      closeAccessibilityLabel="Close role editor"
      contentContainerStyle={styles.content}
      presentation="bottom-sheet"
      footer={
        <FormModalActionFooter>
          <AppButton
            label="Cancel"
            variant="secondary"
            size="lg"
            style={styles.actionButton}
            onPress={onCancel}
            disabled={isSaving}
          />
          <AppButton
            label={isSaving ? "Saving..." : "Save Role"}
            variant="primary"
            size="lg"
            style={styles.actionButton}
            onPress={onSave}
            disabled={isSaving}
          />
        </FormModalActionFooter>
      }
    >
      <LabeledTextInput
        label="Role Name"
        value={roleName}
        onChangeText={onRoleNameChange}
        placeholder="Enter role name"
        editable={!isSaving}
        errorText={fieldErrors.roleName}
      />

      <Text style={styles.permissionSelectorTitle}>Permissions</Text>
      <ScrollView
        style={styles.permissionScroll}
        contentContainerStyle={styles.permissionScrollContent}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {permissionGroups.map((permissionGroup) => (
          <Card key={permissionGroup.module} style={styles.permissionGroupWrap}>
            <Text style={styles.permissionGroupTitle}>{permissionGroup.module}</Text>
            {permissionGroup.permissions.map((permission) => {
              const isSelected = selectedPermissionCodes.includes(permission.code);

              return (
                <Pressable
                  key={permission.code}
                  style={styles.permissionRow}
                  onPress={() => onTogglePermission(permission.code)}
                  disabled={isSaving}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.permissionToggleIconWrap,
                      isSelected ? styles.permissionToggleSelected : null,
                    ]}
                  >
                    {isSelected ? (
                      <Check size={14} color={theme.colors.primaryForeground} />
                    ) : (
                      <CircleDashed size={14} color={theme.colors.mutedForeground} />
                    )}
                  </View>
                  <View style={styles.permissionRowTextWrap}>
                    <Text style={styles.permissionRowTitle}>{permission.label}</Text>
                    <Text style={styles.permissionRowSubtitle}>
                      {permission.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        ))}
      </ScrollView>
    </FormSheetModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.md),
    },
    permissionSelectorTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      fontFamily: "InterBold",
    },
    permissionScroll: {
      minHeight: theme.scaleSpace(220),
      maxHeight: theme.scaleSpace(380),
    },
    permissionScrollContent: {
      gap: theme.scaleSpace(spacing.sm),
      paddingBottom: theme.scaleSpace(spacing.sm),
    },
    permissionGroupWrap: {
      borderRadius: radius.lg,
      padding: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
    },
    permissionGroupTitle: {
      color: theme.colors.primary,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.55,
    },
    permissionRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.scaleSpace(spacing.sm),
      paddingVertical: theme.scaleSpace(3),
    },
    permissionToggleIconWrap: {
      width: theme.scaleSpace(22),
      height: theme.scaleSpace(22),
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.secondary,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginTop: theme.scaleSpace(1),
    },
    permissionToggleSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    permissionRowTextWrap: {
      flex: 1,
      gap: theme.scaleSpace(2),
    },
    permissionRowTitle: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterSemiBold",
    },
    permissionRowSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    actionButton: {
      flex: 1,
    },
  });
