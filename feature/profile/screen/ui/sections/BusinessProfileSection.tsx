import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Edit3, Save, X } from "lucide-react-native";
import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { AppIconButton } from "@/shared/components/reusable/Buttons/AppIconButton";
import { Card } from "@/shared/components/reusable/Cards/Card";
import { Dropdown, DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { EditableBusinessProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { ProfileField } from "./ProfileField";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

type BusinessProfileSectionProps = {
  activeBusinessProfileForm: EditableBusinessProfile;
  hasActiveBusinessProfile: boolean;
  canEditBusinessProfile: boolean;
  isBusinessEditing: boolean;
  isSavingBusinessProfile: boolean;
  businessTypeOptions: readonly { value: string; label: string }[];
  onStartBusinessEdit: () => void;
  onCancelBusinessEdit: () => void;
  onUpdateBusinessProfileField: (
    field: keyof EditableBusinessProfile,
    value: string,
  ) => void;
  onSaveBusinessProfile: () => Promise<void>;
};

export function BusinessProfileSection({
  activeBusinessProfileForm,
  hasActiveBusinessProfile,
  canEditBusinessProfile,
  isBusinessEditing,
  isSavingBusinessProfile,
  businessTypeOptions,
  onStartBusinessEdit,
  onCancelBusinessEdit,
  onUpdateBusinessProfileField,
  onSaveBusinessProfile,
}: BusinessProfileSectionProps) {
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

  const businessTypeDropdownOptions = useMemo<DropdownOption[]>(
    () => businessTypeOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
    [businessTypeOptions],
  );

  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Business Profile</Text>
        {!isBusinessEditing && canEditBusinessProfile ? (
          <AppButton
            onPress={onStartBusinessEdit}
            label={hasActiveBusinessProfile ? "Edit" : "Set up"}
            variant="accent"
            size="sm"
            leadingIcon={<Edit3 size={14} color={colors.primary} />}
          />
        ) : isBusinessEditing ? (
          <View style={styles.inlineActionsWrap}>
            <AppIconButton
              onPress={onCancelBusinessEdit}
            >
              <X size={14} color={colors.destructive} />
            </AppIconButton>
            <AppIconButton
              onPress={() => {
                void onSaveBusinessProfile();
              }}
            >
              <Save size={14} color={colors.success} />
            </AppIconButton>
          </View>
        ) : (
          <Text style={styles.readOnlyBadge}>Read only</Text>
        )}
      </View>

      <ProfileField
        label="Legal Business Name"
        value={activeBusinessProfileForm.legalBusinessName}
        editable={isBusinessEditing}
        onChangeText={(nextValue) => {
          onUpdateBusinessProfileField("legalBusinessName", nextValue);
        }}
        placeholder="Registered legal business name"
        autoCapitalize="words"
      />

      <ProfileField
        label="Business Phone"
        value={activeBusinessProfileForm.businessPhone}
        editable={isBusinessEditing}
        onChangeText={(nextValue) => {
          onUpdateBusinessProfileField("businessPhone", nextValue);
        }}
        placeholder="+977..."
        autoCapitalize="none"
        keyboardType="phone-pad"
      />

      <ProfileField
        label="Registered / Operating Address"
        value={activeBusinessProfileForm.registeredAddress}
        editable={isBusinessEditing}
        onChangeText={(nextValue) => {
          onUpdateBusinessProfileField("registeredAddress", nextValue);
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
            {isBusinessEditing ? (
              <Dropdown
                value={activeBusinessProfileForm.businessType}
                options={businessTypeDropdownOptions}
                onChange={(nextValue) => {
                  onUpdateBusinessProfileField("businessType", nextValue);
                }}
                placeholder="Select business type"
                modalTitle="Choose Business Type"
                showLeadingIcon={false}
                triggerStyle={styles.dropdownTrigger}
                triggerTextStyle={styles.dropdownTriggerText}
              />
            ) : (
              <Text style={styles.readOnlyValue}>
                {activeBusinessProfileForm.businessType || "-"}
              </Text>
            )}
          </View>

          <ProfileField
            label="Business Logo URL"
            value={activeBusinessProfileForm.businessLogoUrl}
            editable={isBusinessEditing}
            onChangeText={(nextValue) => {
              onUpdateBusinessProfileField("businessLogoUrl", nextValue);
            }}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />

          <ProfileField
            label="Business Email"
            value={activeBusinessProfileForm.businessEmail}
            editable={isBusinessEditing}
            onChangeText={(nextValue) => {
              onUpdateBusinessProfileField("businessEmail", nextValue);
            }}
            placeholder="business@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <ProfileField
            label="Currency"
            value={activeBusinessProfileForm.currencyCode}
            editable={isBusinessEditing}
            onChangeText={(nextValue) => {
              onUpdateBusinessProfileField("currencyCode", nextValue);
            }}
            placeholder="NPR"
            autoCapitalize="characters"
          />

          <ProfileField
            label="Country"
            value={activeBusinessProfileForm.country}
            editable={isBusinessEditing}
            onChangeText={(nextValue) => {
              onUpdateBusinessProfileField("country", nextValue);
            }}
            placeholder="Nepal"
            autoCapitalize="words"
          />

          <ProfileField
            label="City"
            value={activeBusinessProfileForm.city}
            editable={isBusinessEditing}
            onChangeText={(nextValue) => {
              onUpdateBusinessProfileField("city", nextValue);
            }}
            placeholder="Kathmandu"
            autoCapitalize="words"
          />

          <ProfileField
            label="District / State"
            value={activeBusinessProfileForm.stateOrDistrict}
            editable={isBusinessEditing}
            onChangeText={(nextValue) => {
              onUpdateBusinessProfileField("stateOrDistrict", nextValue);
            }}
            placeholder="Bagmati"
            autoCapitalize="words"
          />

          <ProfileField
            label="PAN / VAT / GSTIN"
            value={activeBusinessProfileForm.taxRegistrationId}
            editable={isBusinessEditing}
            onChangeText={(nextValue) => {
              onUpdateBusinessProfileField("taxRegistrationId", nextValue);
            }}
            placeholder="Tax registration identifier"
            autoCapitalize="characters"
          />
        </View>
      ) : null}

      {isSavingBusinessProfile ? (
        <Text style={styles.pendingText}>Saving business profile...</Text>
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
  readOnlyBadge: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: "InterSemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  inlineActionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
  readOnlyValue: {
    color: colors.cardForeground,
    fontSize: 14,
    fontFamily: "InterSemiBold",
    minHeight: 42,
    textAlignVertical: "center",
  },
  pendingText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: "InterSemiBold",
  },
});

