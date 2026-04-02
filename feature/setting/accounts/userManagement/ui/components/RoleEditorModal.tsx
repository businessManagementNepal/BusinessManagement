import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check, CircleDashed, X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { UserManagementPermission } from "../../types/userManagement.types";

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
  isSaving,
  onRoleNameChange,
  onTogglePermission,
  onCancel,
  onSave,
}: RoleEditorModalProps) {
  const modalTitle = mode === "create" ? "Create Role" : "Edit Role";

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.modalDismissArea} onPress={onCancel} />

        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <Text style={styles.modalSubtitle}>Set role name and permissions</Text>
            </View>

            <AppIconButton
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Close role editor"
            >
              <X size={18} color={colors.mutedForeground} />
            </AppIconButton>
          </View>

          <LabeledTextInput
            label="Role name"
            value={roleName}
            onChangeText={onRoleNameChange}
            placeholder="Enter role name"
            editable={!isSaving}
            containerStyle={styles.roleNameField}
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
                    >
                      <View style={styles.permissionToggleIconWrap}>
                        {isSelected ? (
                          <Check size={14} color={colors.success} />
                        ) : (
                          <CircleDashed size={14} color={colors.mutedForeground} />
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

          <View style={styles.actionRow}>
            <AppButton
              label="Cancel"
              variant="secondary"
              size="md"
              style={styles.actionButton}
              onPress={onCancel}
              disabled={isSaving}
            />
            <AppButton
              label={isSaving ? "Saving..." : "Save Role"}
              variant="primary"
              size="md"
              style={styles.actionButton}
              onPress={onSave}
              disabled={isSaving}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    zIndex: 1,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  modalTitle: {
    color: colors.cardForeground,
    fontSize: 18,
    fontFamily: "InterBold",
  },
  modalSubtitle: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  roleNameField: {
    marginBottom: spacing.sm,
  },
  permissionSelectorTitle: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
    marginBottom: spacing.xs,
  },
  permissionScroll: {
    maxHeight: 360,
  },
  permissionScrollContent: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  permissionGroupWrap: {
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  permissionGroupTitle: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    paddingVertical: 4,
  },
  permissionToggleIconWrap: {
    width: 20,
    alignItems: "center",
    paddingTop: 2,
  },
  permissionRowTextWrap: {
    flex: 1,
  },
  permissionRowTitle: {
    color: colors.cardForeground,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  permissionRowSubtitle: {
    color: colors.mutedForeground,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  actionRow: {
    marginTop: spacing.xs,
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
  },
});
