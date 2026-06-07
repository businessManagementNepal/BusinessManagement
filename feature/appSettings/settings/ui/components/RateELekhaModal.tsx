import { AppButton } from "@/shared/components/reusable/Buttons/AppButton";
import { FormSheetModal } from "@/shared/components/reusable/Form/FormSheetModal";
import { LabeledTextInput } from "@/shared/components/reusable/Form/LabeledTextInput";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import { Star } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type RateELekhaModalProps = {
  visible: boolean;
  ratingValue: number;
  review: string;
  isSubmitting: boolean;
  errorMessage: string | null;
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
  onClose,
  onSelectRating,
  onReviewChange,
  onSubmit,
}: RateELekhaModalProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <FormSheetModal
      visible={visible}
      title="Rate e-Lekha"
      onClose={onClose}
      presentation="bottom-sheet"
      contentContainerStyle={styles.content}
    >
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Rating</Text>
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
                  color={isActive ? theme.colors.warning : theme.colors.border}
                  fill={isActive ? theme.colors.warning : "transparent"}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <LabeledTextInput
        label="Write a Review (Optional)"
        value={review}
        onChangeText={onReviewChange}
        placeholder="Tell us what you like or what we can improve..."
        multiline={true}
      />

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

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

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      gap: theme.scaleSpace(spacing.md),
    },
    fieldWrap: {
      gap: theme.scaleSpace(spacing.xs),
    },
    fieldLabel: {
      color: theme.colors.cardForeground,
      fontFamily: "InterSemiBold",
      fontSize: theme.scaleText(14),
    },
    helperText: {
      color: theme.colors.mutedForeground,
      fontSize: theme.scaleText(14),
      lineHeight: theme.scaleLineHeight(20),
      fontFamily: "InterMedium",
      textAlign: "center",
    },
    starRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.scaleSpace(spacing.xs),
    },
    starButton: {
      width: theme.scaleSpace(48),
      height: theme.scaleSpace(48),
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: theme.scaleText(12),
      lineHeight: theme.scaleLineHeight(17),
      fontFamily: "InterSemiBold",
    },
    submitButton: {
      marginTop: theme.scaleSpace(spacing.xs),
    },
  });
