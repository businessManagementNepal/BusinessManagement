import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Edit3, Save, X } from "lucide-react-native";
import { EditablePersonalProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { ProfileField } from "./ProfileField";
import { colors } from "@/shared/components/theme/colors";
import { spacing } from "@/shared/components/theme/spacing";

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
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Profile</Text>
        {!isPersonalEditing ? (
          <AppButton
            onPress={onStartPersonalEdit}
            label="Edit"
            variant="accent"
            size="sm"
            leadingIcon={<Edit3 size={14} color={colors.primary} />}
          />
        ) : (
          <View style={styles.inlineActionsWrap}>
            <AppIconButton
              onPress={onCancelPersonalEdit}
            >
              <X size={14} color={colors.destructive} />
            </AppIconButton>
            <AppIconButton
              onPress={() => {
                void onSavePersonalProfile();
              }}
            >
              <Save size={14} color={colors.success} />
            </AppIconButton>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
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
    fontFamily: "InterBold",
  },
  inlineActionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pendingText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
});

