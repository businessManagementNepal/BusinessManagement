import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import {
  Camera,
  Mail,
  PencilLine,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react-native";
import { EditablePersonalProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { ProfileField } from "./ProfileField";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { pickImageFromLibrary } from "@/shared/utils/media/pickImage";

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
  const [isPickingImage, setIsPickingImage] = React.useState(false);
  const profileImageUrl = personalProfileForm.profileImageUrl.trim();

  const onPickProfileImage = React.useCallback(async () => {
    if (!isPersonalEditing || isPickingImage) {
      return;
    }

    setIsPickingImage(true);
    try {
      const pickedImage = await pickImageFromLibrary();
      if (!pickedImage) {
        return;
      }

      onUpdatePersonalProfileField(
        "profileImageUrl",
        pickedImage.dataUrl ?? pickedImage.uri,
      );
    } finally {
      setIsPickingImage(false);
    }
  }, [isPersonalEditing, isPickingImage, onUpdatePersonalProfileField]);

  const onClearProfileImage = React.useCallback(() => {
    onUpdatePersonalProfileField("profileImageUrl", "");
  }, [onUpdatePersonalProfileField]);

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        {!isPersonalEditing ? (
          <Pressable
            onPress={onStartPersonalEdit}
            style={styles.editTrigger}
            accessibilityRole="button"
          >
            <PencilLine size={14} color={colors.primary} />
            <Text style={styles.editLabel}>Edit</Text>
          </Pressable>
        ) : (
          <View style={styles.editingActions}>
            <Pressable
              onPress={onCancelPersonalEdit}
              style={styles.actionTrigger}
              accessibilityRole="button"
            >
              <X size={14} color={colors.destructive} />
              <Text style={styles.cancelLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void onSavePersonalProfile();
              }}
              style={styles.actionTrigger}
              accessibilityRole="button"
            >
              <Save size={14} color={colors.success} />
              <Text style={styles.saveLabel}>Save</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Personal Information</Text>
      <Card style={styles.sectionCard}>
        <View style={styles.profileImageRow}>
          <View style={styles.profileImagePreview}>
            {profileImageUrl.length > 0 ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <UserRound size={24} color={colors.mutedForeground} />
            )}
          </View>

          <View style={styles.profileImageActions}>
            <Pressable
              onPress={() => {
                void onPickProfileImage();
              }}
              style={[
                styles.profileImageButton,
                !isPersonalEditing ? styles.profileImageButtonDisabled : null,
              ]}
              accessibilityRole="button"
              disabled={!isPersonalEditing || isPickingImage}
            >
              <Camera size={14} color={colors.primary} />
              <Text style={styles.profileImageButtonLabel}>
                {isPickingImage ? "Selecting..." : "Choose photo"}
              </Text>
            </Pressable>

            {isPersonalEditing && profileImageUrl.length > 0 ? (
              <Pressable
                onPress={onClearProfileImage}
                style={styles.clearImageButton}
                accessibilityRole="button"
              >
                <Text style={styles.clearImageButtonLabel}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
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
          keyboardType="default"
          multiline={false}
          numberOfLines={1}
          autoComplete={null}
          textContentType={null}
          icon={<UserRound size={16} color={colors.mutedForeground} />}
          isLast={false}
        />

        <ProfileField
          label="Phone"
          value={personalProfileForm.phone}
          editable={isPersonalEditing}
          onChangeText={(nextValue) => {
            onUpdatePersonalProfileField("phone", nextValue);
          }}
          placeholder="Phone number"
          autoCapitalize="none"
          keyboardType="phone-pad"
          multiline={false}
          numberOfLines={1}
          autoComplete={null}
          textContentType={null}
          icon={<Phone size={16} color={colors.mutedForeground} />}
          isLast={false}
        />

        <ProfileField
          label="Email"
          value={personalProfileForm.email}
          editable={isPersonalEditing}
          onChangeText={(nextValue) => {
            onUpdatePersonalProfileField("email", nextValue);
          }}
          placeholder="Email address"
          autoCapitalize="none"
          keyboardType="email-address"
          multiline={false}
          numberOfLines={1}
          autoComplete="email"
          textContentType="emailAddress"
          icon={<Mail size={16} color={colors.mutedForeground} />}
          isLast={true}
        />
      </Card>

      {isSavingPersonalProfile ? (
        <Text style={styles.pendingText}>Saving personal profile...</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontFamily: "InterBold",
  },
  editTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  editLabel: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  editingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cancelLabel: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  saveLabel: {
    color: colors.success,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  sectionCard: {
    padding: 0,
  },
  profileImageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileImagePreview: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileImageActions: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  profileImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  profileImageButtonDisabled: {
    opacity: 0.55,
  },
  profileImageButtonLabel: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  clearImageButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  clearImageButtonLabel: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  pendingText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
});
