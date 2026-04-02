import React, { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CircleCheck,
  CircleDashed,
  ChevronRight,
  Pencil,
  Power,
  Plus,
  Search,
  Shield,
  Trash2,
  Users,
} from "lucide-react-native";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { ActionCardButton } from "@/shared/components/reusable/Cards/ActionCardButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { StatCard } from "@/shared/components/reusable/Cards/StatCard";
import { PrimaryHeader } from "@/shared/components/reusable/ScreenLayouts/PrimaryHeader";
import { ScreenContainer } from "@/shared/components/reusable/ScreenLayouts/ScreenContainer";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { UserManagementPermission } from "../types/userManagement.types";
import { UserManagementViewModel } from "../viewModel/userManagement.viewModel";
import { SIGN_UP_PHONE_COUNTRY_OPTIONS } from "@/feature/auth/signUp/types/signUp.types";
import {
  RoleEditorModal,
  RoleEditorPermissionGroup,
} from "./components/RoleEditorModal";
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

  for (const permission of permissions) {
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
  const permissionGroups = useMemo(
    () => groupPermissionsByModule(viewModel.permissions),
    [viewModel.permissions],
  );
  const roleOptions = useMemo<StaffMemberRoleOption[]>(
    () =>
      viewModel.roles
        .filter((role) => !(role.isSystem && role.name.toLowerCase() === "owner"))
        .map((role) => ({
          remoteId: role.remoteId,
          label: role.name,
        })),
    [viewModel.roles],
  );

  const isRoleEditorOpen = Boolean(viewModel.roleEditor.mode);
  const isMemberEditorOpen = Boolean(viewModel.memberEditor.mode);

  return (
    <ScreenContainer
      showDivider={true}
      baseBottomPadding={spacing.xxl}
      header={
        <PrimaryHeader
          title="User Management"
          showBack={true}
          showBell={false}
          showProfile={false}
          onBack={viewModel.onBack}
        />
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
                ? colors.destructive
                : isSuccess
                  ? colors.success
                  : colors.foreground;

              return (
                <StatCard
                  key={summaryCard.id}
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

          <View style={styles.searchWrap}>
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              value={viewModel.searchQuery}
              onChangeText={viewModel.onChangeSearchQuery}
              placeholder="Search staff..."
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView
            horizontal={true}
            style={styles.filterScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            alwaysBounceVertical={false}
          >
            {viewModel.roleFilters.map((roleFilter) => {
              const isSelected =
                roleFilter.key === viewModel.selectedRoleFilterKey;

              return (
                <Pressable
                  key={roleFilter.key}
                  style={[
                    styles.filterChip,
                    isSelected ? styles.filterChipActive : null,
                  ]}
                  onPress={() => viewModel.onSelectRoleFilter(roleFilter.key)}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected ? styles.filterChipTextActive : null,
                    ]}
                  >
                    {roleFilter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Card style={styles.listCard}>
            {viewModel.memberListItems.length === 0 ? (
              <View style={styles.emptyStateWrap}>
                <Text style={styles.emptyStateText}>
                  No staff members matched your search or filter.
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
                                ? colors.success
                                : colors.mutedForeground
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
                                ? colors.warning
                                : colors.success
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
                          <Trash2 size={15} color={colors.destructive} />
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
                <Shield size={14} color={colors.primary} />
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
                          <Pencil size={15} color={colors.success} />
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
                              ? colors.mutedForeground
                            : colors.destructive
                          }
                        />
                      </AppIconButton>
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {viewModel.canManageStaff ? (
            <ActionCardButton
              title="Add Staff Member"
              subtitle="Create a new staff login and assign access."
              style={styles.addButton}
              leadingIcon={<Plus size={16} color={colors.primaryForeground} />}
              trailingIcon={<ChevronRight size={16} color={colors.mutedForeground} />}
              onPress={() => viewModel.onStartCreateMember()}
            />
          ) : null}

          {viewModel.canManageRoles ? (
            <ActionCardButton
              title="Create Role"
              subtitle="Define a reusable permission set."
              style={styles.secondaryButton}
              leadingIcon={<Shield size={16} color={colors.primary} />}
              trailingIcon={<ChevronRight size={16} color={colors.mutedForeground} />}
              onPress={() => viewModel.onStartCreateRole()}
            />
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

      {viewModel.memberEditor.mode ? (
        <StaffMemberEditorModal
          visible={isMemberEditorOpen}
          mode={viewModel.memberEditor.mode}
          fullName={viewModel.memberEditor.fullName}
          phoneCountryCode={viewModel.memberEditor.phoneCountryCode}
          phoneCountryOptions={SIGN_UP_PHONE_COUNTRY_OPTIONS}
          phone={viewModel.memberEditor.phone}
          email={viewModel.memberEditor.email}
          password={viewModel.memberEditor.password}
          roleRemoteId={viewModel.memberEditor.roleRemoteId}
          roleOptions={roleOptions}
          canAssignRoles={viewModel.canAssignRoles}
          isSaving={viewModel.isSavingMember}
          onChangeFullName={viewModel.onChangeMemberFullName}
          onChangeSelectedPhoneCountry={viewModel.onChangeMemberSelectedPhoneCountry}
          onChangePhone={viewModel.onChangeMemberPhone}
          onChangeEmail={viewModel.onChangeMemberEmail}
          onChangePassword={viewModel.onChangeMemberPassword}
          onChangeRole={viewModel.onChangeMemberRole}
          onCancel={viewModel.onCancelMemberEditor}
          onSave={() => {
            void viewModel.onSaveMember();
          }}
        />
      ) : null}

      {viewModel.roleEditor.mode ? (
        <RoleEditorModal
          visible={isRoleEditorOpen}
          mode={viewModel.roleEditor.mode}
          roleName={viewModel.roleEditor.roleName}
          selectedPermissionCodes={viewModel.roleEditor.selectedPermissionCodes}
          permissionGroups={permissionGroups}
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

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchWrap: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    minHeight: 42,
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterMedium",
  },
  filterRow: {
    gap: spacing.xs,
    paddingVertical: 2,
    paddingRight: spacing.md,
    alignItems: "center",
  },
  filterScroll: {
    minHeight: 34,
    maxHeight: 34,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 14,
    fontFamily: "InterSemiBold",
  },
  filterChipTextActive: {
    color: colors.primaryForeground,
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
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleListHeaderText: {
    color: colors.cardForeground,
    fontSize: 13,
    fontFamily: "InterBold",
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  roleName: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  roleTag: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleTagText: {
    color: colors.primary,
    fontSize: 10,
    fontFamily: "InterBold",
  },
  roleMeta: {
    marginTop: 3,
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterMedium",
  },
  emptyStateWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  emptyStateText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: "InterMedium",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberRowLast: {
    borderBottomWidth: 0,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.primary,
    fontSize: 15,
    fontFamily: "InterBold",
  },
  memberBody: {
    flex: 1,
    minWidth: 0,
  },
  memberTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    color: colors.cardForeground,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: "InterSemiBold",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  statusDotActive: {
    backgroundColor: colors.success,
  },
  statusDotInactive: {
    backgroundColor: colors.mutedForeground,
  },
  memberSubtitle: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: "InterMedium",
  },
  memberMetaRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rolePill: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rolePillText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: "InterBold",
  },
  memberMetaText: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterMedium",
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconButton: {
    width: 30,
    height: 30,
  },
  iconButtonSuccess: {
    backgroundColor: "#E4F4EA",
  },
  iconButtonWarning: {
    backgroundColor: "#FFF2D7",
  },
  iconButtonDanger: {
    backgroundColor: "#FBE4E4",
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  addButton: {
    marginTop: spacing.xs,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
  permissionWarningText: {
    color: colors.warning,
    fontSize: 12,
    fontFamily: "InterSemiBold",
    paddingHorizontal: 2,
  },
  feedbackCardError: {
    borderColor: "#F6D1D1",
    backgroundColor: "#FFF2F2",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  feedbackErrorText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterSemiBold",
    lineHeight: 18,
  },
  feedbackCardSuccess: {
    borderColor: "#CCEBD8",
    backgroundColor: "#F0FAF4",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  feedbackSuccessText: {
    color: colors.success,
    fontSize: 12,
    fontFamily: "InterSemiBold",
    lineHeight: 18,
  },
});
