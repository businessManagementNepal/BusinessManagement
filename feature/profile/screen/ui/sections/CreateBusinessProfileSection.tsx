import React, { useMemo } from "react";
import {
  ChevronDown,
  Plus,
  Store,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  Building2,
  Shield,
  Camera,
} from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { Dropdown, DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { EditableBusinessProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { ProfileField } from "./ProfileField";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { pickImageFromLibrary } from "@/shared/utils/media/pickImage";

type CreateBusinessProfileSectionProps = {
  createBusinessProfileForm: EditableBusinessProfile;
  isCreateBusinessExpanded: boolean;
  isCreatingBusinessProfile: boolean;
  businessTypeOptions: readonly { value: string; label: string }[];
  onToggleCreateBusinessExpanded: () => void;
  onUpdateCreateBusinessProfileField: (
    field: keyof EditableBusinessProfile,
    value: string,
  ) => void;
  onCreateBusinessProfile: () => Promise<void>;
};

export function CreateBusinessProfileSection({
  createBusinessProfileForm,
  isCreateBusinessExpanded,
  isCreatingBusinessProfile,
  businessTypeOptions,
  onToggleCreateBusinessExpanded,
  onUpdateCreateBusinessProfileField,
  onCreateBusinessProfile,
}: CreateBusinessProfileSectionProps) {
  const [isPickingLogo, setIsPickingLogo] = React.useState(false);
  const establishedYear = useMemo(
    () => String(new Date().getFullYear()),
    [],
  );
  const businessLogoUrl = createBusinessProfileForm.businessLogoUrl.trim();

  const businessTypeDropdownOptions = useMemo<DropdownOption[]>(
    () =>
      businessTypeOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [businessTypeOptions],
  );

  const onPickBusinessLogo = React.useCallback(async () => {
    if (isCreatingBusinessProfile || isPickingLogo) {
      return;
    }

    setIsPickingLogo(true);
    try {
      const pickedImage = await pickImageFromLibrary();
      if (!pickedImage) {
        return;
      }

      onUpdateCreateBusinessProfileField(
        "businessLogoUrl",
        pickedImage.dataUrl ?? pickedImage.uri,
      );
    } finally {
      setIsPickingLogo(false);
    }
  }, [
    isCreatingBusinessProfile,
    isPickingLogo,
    onUpdateCreateBusinessProfileField,
  ]);

  const onClearBusinessLogo = React.useCallback(() => {
    onUpdateCreateBusinessProfileField("businessLogoUrl", "");
  }, [onUpdateCreateBusinessProfileField]);

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>More</Text>
      <Card style={styles.sectionCard}>
        <Pressable
          style={styles.createTriggerRow}
          onPress={onToggleCreateBusinessExpanded}
          accessibilityRole="button"
        >
          <View style={styles.triggerLeft}>
            <View style={styles.triggerIconWrap}>
              <Plus size={16} color={colors.primary} />
            </View>
            <View style={styles.triggerCopy}>
              <Text style={styles.triggerTitle}>Create New Business</Text>
              <Text style={styles.triggerSubtitle}>Add another workspace</Text>
            </View>
          </View>
          <ChevronDown
            size={16}
            color={colors.mutedForeground}
            style={isCreateBusinessExpanded ? styles.chevronOpen : undefined}
          />
        </Pressable>

        {isCreateBusinessExpanded ? (
          <View style={styles.expandedWrap}>
            <Card style={styles.formCard}>
              <View style={styles.logoRow}>
                <View style={styles.logoPreview}>
                  {businessLogoUrl.length > 0 ? (
                    <Image
                      source={{ uri: businessLogoUrl }}
                      style={styles.logoImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Building2 size={22} color={colors.mutedForeground} />
                  )}
                </View>

                <View style={styles.logoActions}>
                  <Pressable
                    onPress={() => {
                      void onPickBusinessLogo();
                    }}
                    style={styles.logoButton}
                    accessibilityRole="button"
                    disabled={isCreatingBusinessProfile || isPickingLogo}
                  >
                    <Camera size={14} color={colors.primary} />
                    <Text style={styles.logoButtonText}>
                      {isPickingLogo ? "Selecting..." : "Choose logo"}
                    </Text>
                  </Pressable>

                  {businessLogoUrl.length > 0 ? (
                    <Pressable
                      onPress={onClearBusinessLogo}
                      style={styles.logoClearButton}
                      accessibilityRole="button"
                      disabled={isCreatingBusinessProfile}
                    >
                      <Text style={styles.logoClearText}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <ProfileField
                label="Business Name"
                value={createBusinessProfileForm.legalBusinessName}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("legalBusinessName", nextValue);
                }}
                placeholder="Legal business name"
                autoCapitalize="words"
                keyboardType="default"
                multiline={false}
                numberOfLines={1}
                autoComplete={null}
                textContentType={null}
                icon={<Building2 size={16} color={colors.mutedForeground} />}
                isLast={false}
              />

              <ProfileField
                label="Business Phone"
                value={createBusinessProfileForm.businessPhone}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("businessPhone", nextValue);
                }}
                placeholder="+977..."
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
                value={createBusinessProfileForm.businessEmail}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("businessEmail", nextValue);
                }}
                placeholder="business@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                multiline={false}
                numberOfLines={1}
                autoComplete="email"
                textContentType="emailAddress"
                icon={<Mail size={16} color={colors.mutedForeground} />}
                isLast={false}
              />

              <ProfileField
                label="Address"
                value={createBusinessProfileForm.city}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("city", nextValue);
                }}
                placeholder="City / location"
                autoCapitalize="words"
                keyboardType="default"
                multiline={false}
                numberOfLines={1}
                autoComplete={null}
                textContentType={null}
                icon={<MapPin size={16} color={colors.mutedForeground} />}
                isLast={false}
              />

              <ProfileField
                label="Street address"
                value={createBusinessProfileForm.registeredAddress}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("registeredAddress", nextValue);
                }}
                placeholder="Street, ward, landmark"
                autoCapitalize="sentences"
                keyboardType="default"
                multiline={true}
                numberOfLines={2}
                autoComplete={null}
                textContentType={null}
                icon={<MapPin size={16} color={colors.mutedForeground} />}
                isLast={false}
              />

              <ProfileField
                label="PAN / Tax ID"
                value={createBusinessProfileForm.taxRegistrationId}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("taxRegistrationId", nextValue);
                }}
                placeholder="Tax registration number"
                autoCapitalize="characters"
                keyboardType="default"
                multiline={false}
                numberOfLines={1}
                autoComplete={null}
                textContentType={null}
                icon={<Shield size={16} color={colors.mutedForeground} />}
                isLast={true}
              />

              <View style={styles.businessTypeRow}>
                <View style={styles.rowIconWrap}>
                  <Store size={16} color={colors.mutedForeground} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Business Type</Text>
                  <Dropdown
                    value={createBusinessProfileForm.businessType}
                    options={businessTypeDropdownOptions}
                    onChange={(nextValue) => {
                      onUpdateCreateBusinessProfileField("businessType", nextValue);
                    }}
                    placeholder="Select business type"
                    modalTitle="Choose Business Type"
                    showLeadingIcon={false}
                    disabled={isCreatingBusinessProfile}
                    triggerStyle={styles.dropdownTrigger}
                    triggerTextStyle={styles.dropdownTriggerText}
                  />
                </View>
              </View>

              <View style={[styles.businessTypeRow, styles.lastRow]}>
                <View style={styles.rowIconWrap}>
                  <CalendarDays size={16} color={colors.mutedForeground} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Established</Text>
                  <Text style={styles.rowValue}>{establishedYear}</Text>
                </View>
              </View>
            </Card>

            <AppButton
              label={isCreatingBusinessProfile ? "Creating..." : "Create Business"}
              variant="primary"
              size="lg"
              style={styles.createButton}
              onPress={() => {
                void onCreateBusinessProfile();
              }}
              disabled={isCreatingBusinessProfile}
              accessibilityState={{ busy: isCreatingBusinessProfile }}
            />
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontFamily: "InterBold",
  },
  sectionCard: {
    padding: 0,
  },
  createTriggerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  triggerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerCopy: {
    flex: 1,
  },
  triggerTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  triggerSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 1,
    fontFamily: "InterMedium",
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  expandedWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  formCard: {
    padding: 0,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoPreview: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoActions: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  logoButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  logoClearButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
  },
  logoClearText: {
    color: colors.destructive,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
  businessTypeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIconWrap: {
    marginTop: 3,
    width: 20,
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterMedium",
  },
  rowValue: {
    color: colors.cardForeground,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "InterSemiBold",
  },
  dropdownTrigger: {
    minHeight: 34,
    borderWidth: 0,
    borderRadius: radius.sm,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  dropdownTriggerText: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  createButton: {
    marginTop: spacing.xs,
  },
});
