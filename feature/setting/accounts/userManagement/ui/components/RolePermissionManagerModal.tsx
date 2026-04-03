import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { spacing } from "@/shared/components/theme/spacing";
import {
  PermissionModuleGroup,
  PermissionModuleList,
} from "./PermissionModuleList";

type RolePermissionManagerModalProps = {
  visible: boolean;
  roleName: string;
  permissionGroups: readonly PermissionModuleGroup[];
  selectedPermissionCodes: readonly string[];
  canEditPermissions: boolean;
  isPermissionEditing: boolean;
  isSaving: boolean;
  onEnablePermissionEdit: () => void;
  onTogglePermission: (permissionCode: string) => void;
  onCancel: () => void;
  onDone: () => void;
};

export function RolePermissionManagerModal({
  visible,
  roleName,
  permissionGroups,
  selectedPermissionCodes,
  canEditPermissions,
  isPermissionEditing,
  isSaving,
  onEnablePermissionEdit,
  onTogglePermission,
  onCancel,
  onDone,
}: RolePermissionManagerModalProps) {
  const editButtonLabel = isPermissionEditing ? "Editing" : "Edit Permission";
  const doneButtonLabel = isSaving ? "Saving..." : "Done";

  return (
    <FormSheetModal
      visible={visible}
      title={`${roleName} Permissions`}
      subtitle="Review and assign role access"
      onClose={onCancel}
      closeAccessibilityLabel="Close role permissions"
      contentContainerStyle={styles.content}
      presentation="dialog"
    >
      <ScrollView
        style={styles.permissionScroll}
        contentContainerStyle={styles.permissionScrollContent}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        <PermissionModuleList
          permissionGroups={permissionGroups}
          selectedPermissionCodes={selectedPermissionCodes}
          editable={isPermissionEditing}
          disabled={isSaving}
          onTogglePermission={onTogglePermission}
        />
      </ScrollView>

      <View style={styles.actionRow}>
        <AppButton
          label={editButtonLabel}
          variant="secondary"
          size="lg"
          style={styles.actionButton}
          onPress={onEnablePermissionEdit}
          disabled={isSaving || isPermissionEditing || !canEditPermissions}
        />
        <AppButton
          label={doneButtonLabel}
          variant="primary"
          size="lg"
          style={styles.actionButton}
          onPress={onDone}
          disabled={isSaving}
        />
      </View>
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  permissionScroll: {
    minHeight: 220,
    maxHeight: 400,
  },
  permissionScrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  actionRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
