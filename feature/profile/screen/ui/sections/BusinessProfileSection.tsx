import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Edit3, Save, X } from "lucide-react-native";
import { Dropdown, DropdownOption } from "@/shared/components/reusable/DropDown/Dropdown";
import { EditableBusinessProfile } from "@/feature/profile/screen/types/profileScreen.types";
import { ProfileField } from "./ProfileField";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";

type BusinessProfileSectionProps = {
  activeBusinessProfileForm: EditableBusinessProfile;
  hasActiveBusinessProfile: boolean;
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
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Business Profile</Text>
        {!isBusinessEditing ? (
          <Pressable
            onPress={onStartBusinessEdit}
            style={styles.inlineActionButton}
            accessibilityRole="button"
          >
            <Edit3 size={14} color={colors.primary} />
            <Text style={styles.inlineActionButtonText}>
              {hasActiveBusinessProfile ? "Edit" : "Set up"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.inlineActionsWrap}>
            <Pressable
              onPress={onCancelBusinessEdit}
              style={styles.iconActionButton}
              accessibilityRole="button"
            >
              <X size={14} color={colors.destructive} />
            </Pressable>
            <Pressable
              onPress={() => {
                void onSaveBusinessProfile();
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

      <Pressable
        onPress={() => {
          setIsAdvancedExpanded((previousValue) => !previousValue);
        }}
        style={styles.showMoreButton}
        accessibilityRole="button"
      >
        <Text style={styles.showMoreButtonText}>
          {isAdvancedExpanded ? "Show less" : "Show more"}
        </Text>
      </Pressable>

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
  showMoreButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  showMoreButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
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
    fontWeight: "700",
  },
  dropdownTrigger: {
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cardForeground,
  },
  readOnlyValue: {
    color: colors.cardForeground,
    fontSize: 14,
    fontWeight: "600",
    minHeight: 42,
    textAlignVertical: "center",
  },
  pendingText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
  },
});
