import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { Dropdown, DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { EditableBusinessProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { ProfileField } from "./ProfileField";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

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
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  const businessTypeDropdownOptions = useMemo<DropdownOption[]>(
    () => businessTypeOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
    [businessTypeOptions],
  );

  useEffect(() => {
    if (!isCreateBusinessExpanded) {
      setIsAdvancedExpanded(false);
    }
  }, [isCreateBusinessExpanded]);

  return (
    <Card style={styles.sectionCard}>
      <Pressable
        style={styles.createHeaderButton}
        onPress={onToggleCreateBusinessExpanded}
        accessibilityRole="button"
      >
        <View style={styles.createHeaderLeft}>
          <View style={styles.createIconWrap}>
            <Plus size={16} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.sectionTitle}>Create New Business Profile</Text>
            <Text style={styles.sectionSubtitle}>
              Add another business workspace from profile
            </Text>
          </View>
        </View>

        <ChevronDown
          size={16}
          color={colors.mutedForeground}
          style={isCreateBusinessExpanded ? styles.chevronOpen : undefined}
        />
      </Pressable>

      {isCreateBusinessExpanded ? (
        <View style={styles.createFormWrap}>
          <ProfileField
            label="Legal Business Name"
            value={createBusinessProfileForm.legalBusinessName}
            editable={!isCreatingBusinessProfile}
            onChangeText={(nextValue) => {
              onUpdateCreateBusinessProfileField("legalBusinessName", nextValue);
            }}
            placeholder="Registered legal business name"
            autoCapitalize="words"
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
          />

          <ProfileField
            label="Registered / Operating Address"
            value={createBusinessProfileForm.registeredAddress}
            editable={!isCreatingBusinessProfile}
            onChangeText={(nextValue) => {
              onUpdateCreateBusinessProfileField("registeredAddress", nextValue);
            }}
            placeholder="Street, ward, landmark"
            autoCapitalize="sentences"
            multiline
          />

          <AppButton
            label={isAdvancedExpanded ? "Show less" : "Show more"}
            variant="accent"
            size="sm"
            style={styles.showMoreButton}
            onPress={() => {
              setIsAdvancedExpanded((previousValue) => !previousValue);
            }}
          />

          {isAdvancedExpanded ? (
            <View style={styles.advancedFieldsWrap}>
              <View style={styles.dropdownWrap}>
                <Text style={styles.dropdownLabel}>Business Type / Industry</Text>
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

              <ProfileField
                label="Business Logo URL"
                value={createBusinessProfileForm.businessLogoUrl}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("businessLogoUrl", nextValue);
                }}
                placeholder="https://..."
                autoCapitalize="none"
                keyboardType="url"
              />

              <ProfileField
                label="Business Email"
                value={createBusinessProfileForm.businessEmail}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("businessEmail", nextValue);
                }}
                placeholder="business@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <ProfileField
                label="Currency"
                value={createBusinessProfileForm.currencyCode}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("currencyCode", nextValue);
                }}
                placeholder="NPR"
                autoCapitalize="characters"
              />

              <ProfileField
                label="Country"
                value={createBusinessProfileForm.country}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("country", nextValue);
                }}
                placeholder="Nepal"
                autoCapitalize="words"
              />

              <ProfileField
                label="City"
                value={createBusinessProfileForm.city}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("city", nextValue);
                }}
                placeholder="Kathmandu"
                autoCapitalize="words"
              />

              <ProfileField
                label="District / State"
                value={createBusinessProfileForm.stateOrDistrict}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField("stateOrDistrict", nextValue);
                }}
                placeholder="Bagmati"
                autoCapitalize="words"
              />

              <ProfileField
                label="PAN / VAT / GSTIN"
                value={createBusinessProfileForm.taxRegistrationId}
                editable={!isCreatingBusinessProfile}
                onChangeText={(nextValue) => {
                  onUpdateCreateBusinessProfileField(
                    "taxRegistrationId",
                    nextValue,
                  );
                }}
                placeholder="Tax registration identifier"
                autoCapitalize="characters"
              />
            </View>
          ) : null}

          <AppButton
            label={
              isCreatingBusinessProfile
                ? "Creating..."
                : "Create Business Profile"
            }
            variant="primary"
            size="md"
            style={styles.primaryButton}
            onPress={() => {
              void onCreateBusinessProfile();
            }}
            disabled={isCreatingBusinessProfile}
            accessibilityState={{ busy: isCreatingBusinessProfile }}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  createHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  createHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  createIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterBold",
  },
  sectionSubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  chevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  createFormWrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  showMoreButton: {
    alignSelf: "flex-start",
  },
  advancedFieldsWrap: {
    gap: spacing.sm,
  },
  dropdownWrap: {
    gap: 6,
  },
  dropdownLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "InterBold",
  },
  dropdownTrigger: {
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontFamily: "InterSemiBold",
    color: colors.cardForeground,
  },
  primaryButton: {
    marginTop: spacing.xs,
  },
});

