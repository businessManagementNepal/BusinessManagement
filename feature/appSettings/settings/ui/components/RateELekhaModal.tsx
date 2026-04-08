import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { colors } from "@/shared/components/theme/colors";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { Star } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RateELekhaModalProps = {
  visible: boolean;
  ratingValue: number;
  review: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onClose: () => void;
  onSelectRating: (value: number) => void;
  onReviewChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function RateELekhaModal({
  visible,
  ratingValue,
  review,
  isSubmitting,
  errorMessage,
  successMessage,
  onClose,
  onSelectRating,
  onReviewChange,
  onSubmit,
}: RateELekhaModalProps) {
  return (
    <FormSheetModal
      visible={visible}
      title="Rate e-Lekha"
      onClose={onClose}
      presentation="dialog"
      contentContainerStyle={styles.content}
    >
      <Text style={styles.helperText}>How would you rate your experience?</Text>

      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((value) => {
          const isActive = value <= ratingValue;

          return (
            <Pressable
              key={value}
              style={styles.starButton}
              onPress={() => onSelectRating(value)}
              accessibilityRole="button"
            >
              <Star
                size={34}
                color={isActive ? colors.warning : colors.border}
                fill={isActive ? colors.warning : "transparent"}
              />
            </Pressable>
          );
        })}
      </View>

      <LabeledTextInput
        label="Write a Review (Optional)"
        value={review}
        onChangeText={onReviewChange}
        placeholder="Tell us what you like or what we can improve..."
        multiline={true}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <AppButton
        label={isSubmitting ? "Submitting Rating..." : "Submit Rating"}
        size="lg"
        onPress={() => {
          void onSubmit();
        }}
        disabled={isSubmitting}
        style={styles.submitButton}
      />
    </FormSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  helperText: {
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "InterMedium",
    textAlign: "center",
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  starButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterSemiBold",
  },
  successText: {
    color: colors.success,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "InterSemiBold",
  },
  submitButton: {
    marginTop: spacing.xs,
  },
});
