import React, { useMemo } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  CircleCheck,
  CircleDashed,
  Pencil,
  Power,
  Plus,
  Shield,
  Trash2,
  Users,
} from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { StatCard } from "@/shared/components/reusable/Cards/StatCard";
import { FilterChipGroup } from "@/shared/components/reusable/Form/FilterChipGroup";
import { BottomTabAwareFooter } from "@/shared/components/reusable/ScreenLayouts/BottomTabAwareFooter";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { UserManagementPermission } from "../types/userManagement.types";
import { UserManagementViewModel } from "../viewModel/userManagement.viewModel";
import { SIGN_UP_PHONE_COUNTRY_OPTIONS } from "@/feature/auth/signUp/types/signUp.types";
import {
  RoleEditorModal,
  RoleEditorPermissionGroup,
} from "./components/RoleEditorModal";
import { RolePermissionManagerModal } from "./components/RolePermissionManagerModal";
import {
  StaffMemberEditorModal,
  StaffMemberRoleOption,
} from "./components/StaffMemberEditorModal";

type UserManagementScreenProps = {
  viewModel: UserManagementViewModel;
};

const groupPermissionsByModule = (
  permissions: readonly UserManagementPermission[],
): RoleEditorPermissionGroup[] => {
  const groupedPermissions = new Map<string, UserManagementPermission[]>();
  const uniquePermissionsByCode = new Map<string, UserManagementPermission>();

  for (const permission of permissions) {
    uniquePermissionsByCode.set(permission.code, permission);
  }

  for (const permission of uniquePermissionsByCode.values()) {
    const existingPermissions = groupedPermissions.get(permission.module) ?? [];

    existingPermissions.push(permission);
    groupedPermissions.set(permission.module, existingPermissions);
  }

  return Array.from(groupedPermissions.entries())
    .map(([module, modulePermissions]) => ({
      module,
      permissions: [...modulePermissions].sort((left, right) =>
        left.label.localeCompare(right.label),
      ),
    }))
    .sort((left, right) => left.module.localeCompare(right.module));
};

const getInitials = (value: string): string => {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) {
    return "--";
  }

  return words
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
};

export function UserManagementScreen({ viewModel }: UserManagementScreenProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const permissionGroups = useMemo(
    () => groupPermissionsByModule(viewModel.permissions),
    [viewModel.permissions],
  );
  const roleOptions = useMemo<StaffMemberRoleOption[]>(
    () =>
      viewModel.memberRoleOptions.map((roleOption) => ({
        remoteId: roleOption.remoteId,
        label: roleOption.label,
        category: roleOption.isBusinessDefault ? "default" : "custom",
      })),
    [viewModel.memberRoleOptions],
  );
  const roleFilterOptions = useMemo(
    () => viewModel.roleFilters.map((roleFilter) => ({
      label: roleFilter.label,
      value: roleFilter.key,
    })),
    [viewModel.roleFilters],
  );

  const isRoleEditorOpen = Boolean(viewModel.roleEditor.mode);

  return (
    <ScreenContainer
      showDivider={true}
      baseBottomPadding={140}
      header={
        <PrimaryHeader
          title="User Management"
          showBack={true}
          showBell={false}
          showProfile={false}
          onBack={viewModel.onBack}
        />
      }
      footer={
        viewModel.canManageStaff ? (
          <BottomTabAwareFooter reserveTabBarClearance={false}>
            <AppButton
              label="Add Staff Member"
              variant="primary"
              size="lg"
              style={styles.primaryActionButton}
              leadingIcon={
                <Plus size={18} color={theme.colors.primaryForeground} />
              }
              onPress={() => viewModel.onStartCreateMember()}
            />
          </BottomTabAwareFooter>
        ) : undefined
      }
      contentContainerStyle={styles.contentContainer}
    >
      {viewModel.isLoading ? (
        <Card style={styles.listCard}>
          <View style={styles.emptyStateWrap}>
            <Text style={styles.loadingText}>Loading role access and permissions...</Text>
          </View>
        </Card>
      ) : (
        <>
          <View style={styles.summaryRow}>
            {viewModel.summaryCards.map((summaryCard) => {
              const isSuccess = summaryCard.tone === "success";
              const isDanger = summaryCard.tone === "danger";
              const toneColor = isDanger
                ? theme.colors.destructive
                : isSuccess
                  ? theme.colors.success
                  : theme.colors.foreground;

              return (
                <StatCard
                  key={summaryCard.id}
                  size="dashboard"
                  icon={
                    summaryCard.id === "total" ? (
                      <Users size={16} color={toneColor} />
                    ) : summaryCard.id === "active" ? (
                      <CircleCheck size={16} color={toneColor} />
                    ) : (
                      <CircleDashed size={16} color={toneColor} />
                    )
                  }
                  value={String(summaryCard.value)}
                  label={summaryCard.label}
                  valueColor={toneColor}
                />
              );
            })}
          </View>

          <FilterChipGroup
            options={roleFilterOptions}
            selectedValue={viewModel.selectedRoleFilterKey}
            onSelect={viewModel.onSelectRoleFilter}
            scrollStyle={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
            chipStyle={styles.filterChip}
            selectedChipStyle={styles.filterChipActive}
            chipTextStyle={styles.filterChipText}
            selectedChipTextStyle={styles.filterChipTextActive}
          />

          <Card style={styles.listCard}>
            {viewModel.memberListItems.length === 0 ? (
              <View style={styles.emptyStateWrap}>
                <Text style={styles.emptyStateText}>
                  No staff members matched the selected filter.
                </Text>
              </View>
            ) : (
              viewModel.memberListItems.map((memberListItem, index) => {
                const isLast = index === viewModel.memberListItems.length - 1;
                const nextStatus = memberListItem.isActive ? "inactive" : "active";

                return (
                  <View
                    key={memberListItem.memberRemoteId}
                    style={[styles.memberRow, isLast ? styles.memberRowLast : null]}
                  >
                    <View style={styles.avatarWrap}>
                      <Text style={styles.avatarText}>
                        {getInitials(memberListItem.displayName)}
                      </Text>
                    </View>

                    <View style={styles.memberBody}>
                      <View style={styles.memberTitleRow}>
                        <Text style={styles.memberName}>{memberListItem.displayName}</Text>
                        <View
                          style={[
                            styles.statusDot,
                            memberListItem.isActive
                              ? styles.statusDotActive
                              : styles.statusDotInactive,
                          ]}
                        />
                      </View>

                      <Text style={styles.memberSubtitle} numberOfLines={1}>
                        {memberListItem.email ?? memberListItem.phone ?? memberListItem.statusText}
                      </Text>

                      <View style={styles.memberMetaRow}>
                        <View style={styles.rolePill}>
                          <Text style={styles.rolePillText} numberOfLines={1}>
                            {memberListItem.roleLabel}
                          </Text>
                        </View>
                        <Text style={styles.memberMetaText} numberOfLines={1}>
                          Joined {memberListItem.joinedAtLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      {memberListItem.canEdit ? (
                        <AppIconButton
                          size="sm"
                          style={[
                            styles.iconButton,
                            styles.iconButtonSuccess,
                            !memberListItem.canEdit ? styles.iconButtonDisabled : null,
                          ]}
                          onPress={() =>
                            viewModel.onStartEditMember(memberListItem.memberRemoteId)
                          }
                          disabled={!memberListItem.canEdit}
                          accessibilityRole="button"
                        >
                          <Pencil
                            size={15}
                            color={
                              memberListItem.canEdit
                                ? theme.colors.success
                                : theme.colors.mutedForeground
                            }
                          />
                        </AppIconButton>
                      ) : null}

                      {memberListItem.canToggleStatus ? (
                        <AppIconButton
                          size="sm"
                          style={[
                            styles.iconButton,
                            memberListItem.isActive
                              ? styles.iconButtonWarning
                              : styles.iconButtonSuccess,
                            viewModel.isUpdatingMemberStatus || viewModel.isDeletingMember
                              ? styles.iconButtonDisabled
                              : null,
                          ]}
                          onPress={() =>
                            Alert.alert(
                              nextStatus === "inactive"
                                ? "Deactivate staff member?"
                                : "Reactivate staff member?",
                              nextStatus === "inactive"
                                ? "This member will lose account access until reactivated."
                                : "This member will regain account access.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text:
                                    nextStatus === "inactive"
                                      ? "Deactivate"
                                      : "Reactivate",
                                  style:
                                    nextStatus === "inactive"
                                      ? "destructive"
                                      : "default",
                                  onPress: () => {
                                    void viewModel.onToggleMemberStatus(
                                      memberListItem.memberRemoteId,
                                      nextStatus,
                                    );
                                  },
                                },
                              ],
                            )
                          }
                          disabled={
                            viewModel.isUpdatingMemberStatus || viewModel.isDeletingMember
                          }
                          accessibilityRole="button"
                        >
                          <Power
                            size={15}
                            color={
                              memberListItem.isActive
                                ? theme.colors.warning
                                : theme.colors.success
                            }
                          />
                        </AppIconButton>
                      ) : null}

                      {memberListItem.canDelete ? (
                        <AppIconButton
                          size="sm"
                          style={[
                            styles.iconButton,
                            styles.iconButtonDanger,
                            viewModel.isDeletingMember ? styles.iconButtonDisabled : null,
                          ]}
                          onPress={() =>
                            Alert.alert(
                              "Delete staff member?",
                              "This removes the member from this account and clears assigned role access.",
                              [
                                { text: "Cancel", style: "cancel" },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => {
                                    void viewModel.onDeleteMember(
                                      memberListItem.memberRemoteId,
                                    );
                                  },
                                },
                              ],
                            )
                          }
                          disabled={viewModel.isDeletingMember}
                          accessibilityRole="button"
                        >
                          <Trash2 size={15} color={theme.colors.destructive} />
                        </AppIconButton>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </Card>

          {viewModel.canManageRoles ? (
            <Card style={styles.roleListCard}>
              <View style={styles.roleListHeader}>
                <Shield size={14} color={theme.colors.primary} />
                <Text style={styles.roleListHeaderText}>Roles</Text>
              </View>

              {viewModel.roleListItems.map((roleListItem, index) => {
                const isLast = index === viewModel.roleListItems.length - 1;
                const isDeleteDisabled = viewModel.isDeletingRole || !roleListItem.canDelete;

                return (
                  <View
                    key={roleListItem.roleRemoteId}
                    style={[styles.roleRow, isLast ? styles.roleRowLast : null]}
                  >
                    <View style={styles.roleBody}>
                      <View style={styles.roleTitleRow}>
                        <Text style={styles.roleName}>{roleListItem.name}</Text>
                        {roleListItem.isDefault ? (
                          <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>Default</Text>
                          </View>
                        ) : null}
                        {roleListItem.isSystem ? (
                          <View style={styles.roleTag}>
                            <Text style={styles.roleTagText}>System</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.roleMeta}>
                        {roleListItem.permissionCount} permissions -{" "}
                        {roleListItem.assignedMemberCount} members
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      {roleListItem.canEdit ? (
                        <AppIconButton
                          size="sm"
                          style={[styles.iconButton, styles.iconButtonSuccess]}
                          onPress={() => viewModel.onStartEditRole(roleListItem.roleRemoteId)}
                          accessibilityRole="button"
                        >
                          <Pencil size={15} color={theme.colors.success} />
                        </AppIconButton>
                      ) : null}

                      <AppIconButton
                        size="sm"
                        style={[
                          styles.iconButton,
                          styles.iconButtonDanger,
                          isDeleteDisabled ? styles.iconButtonDisabled : null,
                        ]}
                        onPress={() =>
                          Alert.alert(
                            "Delete role?",
                            "This action permanently removes the role from the account.",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => {
                                  void viewModel.onDeleteRole(roleListItem.roleRemoteId);
                                },
                              },
                            ],
                          )
                        }
                        disabled={isDeleteDisabled}
                        accessibilityRole="button"
                      >
                        <Trash2
                          size={15}
                          color={
                            isDeleteDisabled
                              ? theme.colors.mutedForeground
                              : theme.colors.destructive
                          }
                        />
                      </AppIconButton>
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {!viewModel.canManageStaff ? (
            <Text style={styles.permissionWarningText}>
              You do not have permission to manage staff.
            </Text>
          ) : null}

          {viewModel.screenError ? (
            <Card style={styles.feedbackCardError}>
              <Text style={styles.feedbackErrorText}>{viewModel.screenError}</Text>
            </Card>
          ) : null}

          {viewModel.screenSuccess ? (
            <Card style={styles.feedbackCardSuccess}>
              <Text style={styles.feedbackSuccessText}>{viewModel.screenSuccess}</Text>
            </Card>
          ) : null}
        </>
      )}

      {viewModel.memberEditor.mode && !isRoleEditorOpen ? (
        <StaffMemberEditorModal
          visible={true}
          mode={viewModel.memberEditor.mode}
          fullName={viewModel.memberEditor.fullName}
          phoneCountryCode={viewModel.memberEditor.phoneCountryCode}
          phoneCountryOptions={SIGN_UP_PHONE_COUNTRY_OPTIONS}
          phone={viewModel.memberEditor.phone}
          email={viewModel.memberEditor.email}
          password={viewModel.memberEditor.password}
          roleRemoteId={viewModel.memberEditor.roleRemoteId}
          roleOptions={roleOptions}
          fieldErrors={viewModel.memberEditor.fieldErrors}
          canAssignRoles={viewModel.canAssignRoles}
          canManageRolePermissions={viewModel.canManageRoles}
          isSaving={viewModel.isSavingMember}
          isSavingRole={viewModel.isSavingRole}
          onChangeFullName={viewModel.onChangeMemberFullName}
          onChangeSelectedPhoneCountry={viewModel.onChangeMemberSelectedPhoneCountry}
          onChangePhone={viewModel.onChangeMemberPhone}
          onChangeEmail={viewModel.onChangeMemberEmail}
          onChangePassword={viewModel.onChangeMemberPassword}
          onChangeRole={viewModel.onChangeMemberRole}
          onStartCreateCustomRole={viewModel.onStartCreateCustomRoleForMember}
          onManageRolePermissions={viewModel.onManageSelectedMemberRolePermissions}
          onCancel={viewModel.onCancelMemberEditor}
          onSave={() => {
            void viewModel.onSaveMember();
          }}
        />
      ) : null}

      {viewModel.roleEditor.mode &&
      viewModel.roleEditorPresentation === "permission_manager" ? (
        <RolePermissionManagerModal
          visible={isRoleEditorOpen}
          roleName={viewModel.roleEditor.roleName}
          selectedPermissionCodes={viewModel.roleEditor.selectedPermissionCodes}
          permissionGroups={permissionGroups}
          canEditPermissions={viewModel.canManageRoles}
          isPermissionEditing={viewModel.isRolePermissionEditEnabled}
          isSaving={viewModel.isSavingRole}
          onEnablePermissionEdit={viewModel.onEnableRolePermissionEdit}
          onTogglePermission={viewModel.onToggleRolePermission}
          onCancel={viewModel.onCancelRoleEditor}
          onDone={() => {
            void viewModel.onDoneRolePermissionManager();
          }}
        />
      ) : null}

      {viewModel.roleEditor.mode &&
      viewModel.roleEditorPresentation === "role_form" ? (
        <RoleEditorModal
          visible={isRoleEditorOpen}
          mode={viewModel.roleEditor.mode}
          roleName={viewModel.roleEditor.roleName}
          selectedPermissionCodes={viewModel.roleEditor.selectedPermissionCodes}
          permissionGroups={permissionGroups}
          fieldErrors={viewModel.roleEditor.fieldErrors}
          isSaving={viewModel.isSavingRole}
          onRoleNameChange={viewModel.onChangeRoleName}
          onTogglePermission={viewModel.onToggleRolePermission}
          onCancel={viewModel.onCancelRoleEditor}
          onSave={() => {
            void viewModel.onSaveRole();
          }}
        />
      ) : null}
    </ScreenContainer>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    contentContainer: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingTop: theme.scaleSpace(spacing.md),
      gap: theme.scaleSpace(spacing.sm),
    },
    primaryActionButton: {
      width: "100%",
    },
    summaryRow: {
      flexDirection: "row",
      gap: theme.scaleSpace(spacing.sm),
    },
    filterRow: {
      gap: theme.scaleSpace(spacing.xs),
      paddingVertical: theme.scaleSpace(4),
      paddingRight: theme.scaleSpace(spacing.md),
      alignItems: "center",
    },
    filterScroll: {
      minHeight: theme.scaleSpace(42),
      maxHeight: theme.scaleSpace(42),
      flexGrow: 0,
      flexShrink: 0,
    },
    filterChip: {
      minHeight: theme.scaleSpace(34),
      paddingHorizontal: theme.scaleSpace(12),
      paddingVertical: theme.scaleSpace(6),
      borderRadius: radius.pill,
      backgroundColor: theme.colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
    },
    filterChipText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterSemiBold",
    },
    filterChipTextActive: {
      color: theme.colors.primaryForeground,
    },
    listCard: {
      padding: 0,
      overflow: "hidden",
    },
    roleListCard: {
      padding: 0,
      overflow: "hidden",
    },
    roleListHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
      paddingHorizontal: theme.scaleSpace(spacing.sm + 2),
      paddingVertical: theme.scaleSpace(spacing.sm),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    roleListHeaderText: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterBold",
    },
    roleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
      paddingHorizontal: theme.scaleSpace(spacing.sm + 2),
      paddingVertical: theme.scaleSpace(spacing.sm),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    roleRowLast: {
      borderBottomWidth: 0,
    },
    roleBody: {
      flex: 1,
      minWidth: 0,
    },
    roleTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
      flexWrap: "wrap",
    },
    roleName: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(14),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterSemiBold",
    },
    roleTag: {
      backgroundColor: theme.colors.accent,
      borderRadius: radius.pill,
      paddingHorizontal: theme.scaleSpace(8),
      paddingVertical: theme.scaleSpace(2),
    },
    roleTagText: {
      color: theme.colors.accentForeground,
      fontSize: theme.scaleText(10),
      lineHeight: theme.scaleLineHeight(13),
      fontFamily: "InterBold",
    },
    roleMeta: {
      marginTop: theme.scaleSpace(3),
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterMedium",
    },
    emptyStateWrap: {
      paddingHorizontal: theme.scaleSpace(spacing.md),
      paddingVertical: theme.scaleSpace(spacing.lg),
    },
    loadingText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    emptyStateText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(13),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterMedium",
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.sm),
      paddingHorizontal: theme.scaleSpace(spacing.sm + 2),
      paddingVertical: theme.scaleSpace(spacing.sm + 1),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    memberRowLast: {
      borderBottomWidth: 0,
    },
    avatarWrap: {
      width: theme.scaleSpace(42),
      height: theme.scaleSpace(42),
      borderRadius: radius.pill,
      backgroundColor: theme.colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: theme.colors.accentForeground,
      fontSize: theme.scaleText(15),
      lineHeight: theme.scaleLineHeight(19),
      fontFamily: "InterBold",
    },
    memberBody: {
      flex: 1,
      minWidth: 0,
    },
    memberTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(6),
    },
    memberName: {
      color: theme.colors.cardForeground,
      fontSize: theme.scaleText(15),
      lineHeight: theme.scaleLineHeight(20),
      fontFamily: "InterSemiBold",
    },
    statusDot: {
      width: theme.scaleSpace(8),
      height: theme.scaleSpace(8),
      borderRadius: radius.pill,
    },
    statusDotActive: {
      backgroundColor: theme.colors.success,
    },
    statusDotInactive: {
      backgroundColor: theme.colors.mutedForeground,
    },
    memberSubtitle: {
      marginTop: theme.scaleSpace(2),
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterMedium",
    },
    memberMetaRow: {
      marginTop: theme.scaleSpace(3),
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
    },
    rolePill: {
      backgroundColor: theme.colors.accent,
      borderRadius: radius.pill,
      paddingHorizontal: theme.scaleSpace(8),
      paddingVertical: theme.scaleSpace(2),
    },
    rolePillText: {
      color: theme.colors.accentForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterBold",
    },
    memberMetaText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(11),
      lineHeight: theme.scaleLineHeight(14),
      fontFamily: "InterMedium",
      flexShrink: 1,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.scaleSpace(spacing.xs),
    },
    iconButton: {
      width: theme.scaleSpace(30),
      height: theme.scaleSpace(30),
    },
    iconButtonSuccess: {
      backgroundColor: theme.isDarkMode
        ? "rgba(99, 211, 148, 0.16)"
        : "#E4F4EA",
    },
    iconButtonWarning: {
      backgroundColor: theme.isDarkMode
        ? "rgba(244, 193, 93, 0.18)"
        : "#FFF2D7",
    },
    iconButtonDanger: {
      backgroundColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.16)"
        : "#FBE4E4",
    },
    iconButtonDisabled: {
      opacity: 0.45,
    },
    permissionWarningText: {
      color: theme.colors.warning,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(16),
      fontFamily: "InterSemiBold",
      paddingHorizontal: theme.scaleSpace(2),
    },
    feedbackCardError: {
      borderColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.28)"
        : "#F6D1D1",
      backgroundColor: theme.isDarkMode
        ? "rgba(255, 107, 107, 0.12)"
        : "#FFF2F2",
      paddingHorizontal: theme.scaleSpace(spacing.sm + 2),
      paddingVertical: theme.scaleSpace(spacing.sm),
    },
    feedbackErrorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterSemiBold",
    },
    feedbackCardSuccess: {
      borderColor: theme.isDarkMode
        ? "rgba(99, 211, 148, 0.28)"
        : "#CCEBD8",
      backgroundColor: theme.isDarkMode
        ? "rgba(99, 211, 148, 0.14)"
        : "#F0FAF4",
      paddingHorizontal: theme.scaleSpace(spacing.sm + 2),
      paddingVertical: theme.scaleSpace(spacing.sm),
    },
    feedbackSuccessText: {
      color: theme.colors.success,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(18),
      fontFamily: "InterSemiBold",
    },
  });
