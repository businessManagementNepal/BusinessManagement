import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Edit3, Save, X } from "lucide-react-native";
import { EditablePersonalProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { ProfileField } from "./ProfileField";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

type PersonalProfileSectionProps = {
  personalProfileForm: EditablePersonalProfile;
  isPersonalEditing: boolean;
  isSavingPersonalProfile: boolean;
  onStartPersonalEdit: () => void;
  onCancelPersonalEdit: () => void;
  onUpdatePersonalProfileField: (
    field: keyof EditablePersonalProfile,
    value: string,
  ) => void;
  onSavePersonalProfile: () => Promise<void>;
};

export function PersonalProfileSection({
  personalProfileForm,
  isPersonalEditing,
  isSavingPersonalProfile,
  onStartPersonalEdit,
  onCancelPersonalEdit,
  onUpdatePersonalProfileField,
  onSavePersonalProfile,
}: PersonalProfileSectionProps) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Profile</Text>
        {!isPersonalEditing ? (
          <Pressable
            onPress={onStartPersonalEdit}
            style={styles.inlineActionButton}
            accessibilityRole="button"
          >
            <Edit3 size={14} color={colors.primary} />
            <Text style={styles.inlineActionButtonText}>Edit</Text>
          </Pressable>
        ) : (
          <View style={styles.inlineActionsWrap}>
            <Pressable
              onPress={onCancelPersonalEdit}
              style={styles.iconActionButton}
              accessibilityRole="button"
            >
              <X size={14} color={colors.destructive} />
            </Pressable>
            <Pressable
              onPress={() => {
                void onSavePersonalProfile();
              }}
              style={styles.iconActionButton}
              accessibilityRole="button"
            >
              <Save size={14} color={colors.success} />
            </Pressable>
          </View>
        )}
      </View>

      <ProfileField
        label="Full Name"
        value={personalProfileForm.fullName}
        editable={isPersonalEditing}
        onChangeText={(nextValue) => {
          onUpdatePersonalProfileField("fullName", nextValue);
        }}
        placeholder="Your full name"
        autoCapitalize="words"
      />

      <ProfileField
        label="Phone"
        value={personalProfileForm.phone}
        editable={isPersonalEditing}
        onChangeText={(nextValue) => {
          onUpdatePersonalProfileField("phone", nextValue);
        }}
        placeholder="Phone number"
      />

      <ProfileField
        label="Email"
        value={personalProfileForm.email}
        editable={isPersonalEditing}
        onChangeText={(nextValue) => {
          onUpdatePersonalProfileField("email", nextValue);
        }}
        placeholder="Email address"
      />

      {isSavingPersonalProfile ? (
        <Text style={styles.pendingText}>Saving personal profile...</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontWeight: "800",
  },
  inlineActionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  inlineActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  inlineActionButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  iconActionButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
  },
});
