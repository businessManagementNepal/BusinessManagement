import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useAppTheme } from "@/shared/components/theme/AppThemeProvider";
import { radius, spacing } from "@/shared/components/theme/spacing";
import { useThemedStyles } from "@/shared/components/theme/useThemedStyles";
import {
  AD_MONTH_NAMES,
  BS_MONTH_NAMES,
  CalendarDateParts,
  WEEKDAY_LABELS,
  adDateStringToBsParts,
  bsDatePartsToAdDateString,
  formatDateParts,
  formatDualCalendarDateLabel,
  getAdDaysInMonth,
  getBsDaysInMonth,
  getFirstWeekdayOfAdMonth,
  getFirstWeekdayOfBsMonth,
  getTodayAdDateString,
  getTodayBsParts,
  isValidAdDateString,
  parseDateOnly,
} from "@/shared/utils/date/nepaliCalendar";

type CalendarMode = "ad" | "bs";

type DualCalendarDatePickerProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

const CALENDAR_MODES: CalendarMode[] = ["ad", "bs"];

const emptyMonth: CalendarDateParts = {
  year: 1970,
  month: 1,
  day: 1,
};

const toMonth = ({ year, month }: CalendarDateParts): CalendarDateParts => ({
  year,
  month,
  day: 1,
});

const getCurrentAdParts = (): CalendarDateParts => {
  return parseDateOnly(getTodayAdDateString()) ?? emptyMonth;
};

const getCurrentBsParts = (): CalendarDateParts => {
  return getTodayBsParts() ?? emptyMonth;
};

const getPreviousMonth = (
  currentMonth: CalendarDateParts,
): CalendarDateParts => {
  if (currentMonth.month === 1) {
    return { year: currentMonth.year - 1, month: 12, day: 1 };
  }

  return { year: currentMonth.year, month: currentMonth.month - 1, day: 1 };
};

const getNextMonth = (currentMonth: CalendarDateParts): CalendarDateParts => {
  if (currentMonth.month === 12) {
    return { year: currentMonth.year + 1, month: 1, day: 1 };
  }

  return { year: currentMonth.year, month: currentMonth.month + 1, day: 1 };
};

const getPreviousYear = (
  currentMonth: CalendarDateParts,
): CalendarDateParts => ({
  year: currentMonth.year - 1,
  month: currentMonth.month,
  day: 1,
});

const getNextYear = (currentMonth: CalendarDateParts): CalendarDateParts => ({
  year: currentMonth.year + 1,
  month: currentMonth.month,
  day: 1,
});

const buildCalendarCells = (
  firstWeekday: number,
  daysInMonth: number,
): (number | null)[] => {
  const totalSlots = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: totalSlots }, (_, index) => {
    const day = index - firstWeekday + 1;

    return day < 1 || day > daysInMonth ? null : day;
  });
};

const getModeLabel = (mode: CalendarMode): string => {
  return mode === "ad" ? "English (AD)" : "Nepali (BS)";
};

export function DualCalendarDatePicker({
  label,
  value,
  onChangeText,
  placeholder = "Select date",
  helperText,
  errorText,
  editable = true,
  containerStyle,
}: DualCalendarDatePickerProps) {
  const theme = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("ad");
  const [visibleAdMonth, setVisibleAdMonth] = useState<CalendarDateParts>(
    toMonth(getCurrentAdParts()),
  );
  const [visibleBsMonth, setVisibleBsMonth] = useState<CalendarDateParts>(
    toMonth(getCurrentBsParts()),
  );

  const selectedAdParts = useMemo(() => {
    return isValidAdDateString(value) ? parseDateOnly(value) : null;
  }, [value]);
  const selectedBsParts = useMemo(() => adDateStringToBsParts(value), [value]);
  const hasValue = value.trim().length > 0;
  const displayLabel = hasValue
    ? formatDualCalendarDateLabel(value) || value
    : placeholder;
  const activeMonth = calendarMode === "ad" ? visibleAdMonth : visibleBsMonth;
  const daysInMonth =
    calendarMode === "ad"
      ? getAdDaysInMonth(activeMonth.year, activeMonth.month)
      : getBsDaysInMonth(activeMonth.year, activeMonth.month) ?? 0;
  const firstWeekday =
    calendarMode === "ad"
      ? getFirstWeekdayOfAdMonth(activeMonth.year, activeMonth.month)
      : getFirstWeekdayOfBsMonth(activeMonth.year, activeMonth.month) ?? 0;
  const monthTitle =
    calendarMode === "ad"
      ? `${AD_MONTH_NAMES[activeMonth.month - 1]} ${activeMonth.year} AD`
      : `${BS_MONTH_NAMES[activeMonth.month - 1]} ${activeMonth.year} BS`;
  const calendarCells = useMemo(
    () => buildCalendarCells(firstWeekday, daysInMonth),
    [daysInMonth, firstWeekday],
  );
  const selectedDay =
    calendarMode === "ad" &&
    selectedAdParts?.year === activeMonth.year &&
    selectedAdParts.month === activeMonth.month
      ? selectedAdParts.day
      : calendarMode === "bs" &&
          selectedBsParts?.year === activeMonth.year &&
          selectedBsParts.month === activeMonth.month
        ? selectedBsParts.day
        : null;

  const openPicker = () => {
    if (!editable) {
      return;
    }

    setVisibleAdMonth(toMonth(selectedAdParts ?? getCurrentAdParts()));
    setVisibleBsMonth(toMonth(selectedBsParts ?? getCurrentBsParts()));
    setIsPickerVisible(true);
  };

  const closePicker = () => {
    setIsPickerVisible(false);
  };

  const goToPreviousYear = () => {
    if (calendarMode === "ad") {
      setVisibleAdMonth((currentMonth) => getPreviousYear(currentMonth));
      return;
    }

    setVisibleBsMonth((currentMonth) => getPreviousYear(currentMonth));
  };

  const goToNextYear = () => {
    if (calendarMode === "ad") {
      setVisibleAdMonth((currentMonth) => getNextYear(currentMonth));
      return;
    }

    setVisibleBsMonth((currentMonth) => getNextYear(currentMonth));
  };

  const goToPreviousMonth = () => {
    if (calendarMode === "ad") {
      setVisibleAdMonth((currentMonth) => getPreviousMonth(currentMonth));
      return;
    }

    setVisibleBsMonth((currentMonth) => getPreviousMonth(currentMonth));
  };

  const goToNextMonth = () => {
    if (calendarMode === "ad") {
      setVisibleAdMonth((currentMonth) => getNextMonth(currentMonth));
      return;
    }

    setVisibleBsMonth((currentMonth) => getNextMonth(currentMonth));
  };

  const selectDay = (day: number) => {
    if (calendarMode === "ad") {
      onChangeText(
        formatDateParts({
          year: visibleAdMonth.year,
          month: visibleAdMonth.month,
          day,
        }),
      );
      closePicker();
      return;
    }

    const adDateString = bsDatePartsToAdDateString({
      year: visibleBsMonth.year,
      month: visibleBsMonth.month,
      day,
    });

    if (adDateString) {
      onChangeText(adDateString);
      closePicker();
    }
  };

  const clearDate = () => {
    onChangeText("");
    closePicker();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
        disabled={!editable}
        onPress={openPicker}
        style={[
          styles.input,
          !editable ? styles.inputDisabled : null,
          errorText ? styles.inputError : null,
        ]}
      >
        <Text
          style={[
            styles.inputText,
            hasValue ? null : styles.placeholderText,
            !editable ? styles.disabledText : null,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <CalendarDays size={18} color={theme.colors.mutedForeground} />
      </Pressable>

      {errorText ? (
        <Text style={styles.errorText}>{errorText}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}

      <Modal
        visible={isPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismissArea} onPress={closePicker} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleWrap}>
                <Text style={styles.modalTitle}>Select {label}</Text>
                <Text style={styles.modalSubtitle}>
                  Pick in English AD or Nepali BS. Saved as English AD YYYY-MM-DD.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close date picker"
                onPress={closePicker}
                style={styles.iconButton}
              >
                <X size={18} color={theme.colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.modeTabs}>
              {CALENDAR_MODES.map((mode) => {
                const isSelected = mode === calendarMode;

                return (
                  <Pressable
                    key={mode}
                    style={[styles.modeTab, isSelected ? styles.modeTabActive : null]}
                    onPress={() => setCalendarMode(mode)}
                  >
                    <Text
                      style={[
                        styles.modeTabText,
                        isSelected ? styles.modeTabTextActive : null,
                      ]}
                    >
                      {getModeLabel(mode)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.monthHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous year"
                onPress={goToPreviousYear}
                style={styles.yearJumpButton}
              >
                <Text style={styles.yearJumpText}>{"<<"}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Previous month"
                onPress={goToPreviousMonth}
                style={styles.iconButton}
              >
                <ChevronLeft size={18} color={theme.colors.cardForeground} />
              </Pressable>

              <Text style={styles.monthTitle}>{monthTitle}</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next month"
                onPress={goToNextMonth}
                style={styles.iconButton}
              >
                <ChevronRight size={18} color={theme.colors.cardForeground} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next year"
                onPress={goToNextYear}
                style={styles.yearJumpButton}
              >
                <Text style={styles.yearJumpText}>{">>"}</Text>
              </Pressable>
            </View>

            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((weekday) => (
                <Text key={weekday} style={styles.weekdayText}>
                  {weekday}
                </Text>
              ))}
            </View>

            {daysInMonth > 0 ? (
              <View style={styles.calendarGrid}>
                {calendarCells.map((day, index) => {
                  if (day === null) {
                    return (
                      <View
                        key={`empty-${index}`}
                        style={[styles.dayCell, styles.emptyDayCell]}
                      />
                    );
                  }

                  const isSelected = day === selectedDay;

                  return (
                    <Pressable
                      key={`${activeMonth.year}-${activeMonth.month}-${day}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Select day ${day}`}
                      onPress={() => selectDay(day)}
                      style={[
                        styles.dayCell,
                        isSelected ? styles.selectedDayCell : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelected ? styles.selectedDayText : null,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.unsupportedText}>
                This calendar month is outside the supported date range.
              </Text>
            )}

            <View style={styles.modalFooter}>
              {hasValue ? (
                <Pressable style={styles.clearButton} onPress={clearDate}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </Pressable>
              ) : (
                <View />
              )}

              <Pressable style={styles.cancelButton} onPress={closePicker}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    container: {
      gap: 6,
    },
    label: {
      color: theme.colors.mutedForeground,
      fontSize: 11,
      fontFamily: "InterBold",
      textTransform: "uppercase",
      letterSpacing: 0.45,
    },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.lg,
      backgroundColor: theme.colors.background,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    inputDisabled: {
      opacity: 0.72,
    },
    inputError: {
      borderColor: theme.colors.destructive,
    },
    inputText: {
      flex: 1,
      color: theme.colors.cardForeground,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: "InterMedium",
    },
    placeholderText: {
      color: theme.colors.mutedForeground,
    },
    disabledText: {
      color: theme.colors.mutedForeground,
    },
    helperText: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: "InterMedium",
    },
    errorText: {
      color: theme.colors.destructive,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: "InterSemiBold",
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: theme.colors.overlay,
      paddingHorizontal: spacing.lg,
    },
    modalDismissArea: {
      ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.xl,
      backgroundColor: theme.colors.card,
      padding: spacing.md,
      gap: spacing.sm,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    modalTitleWrap: {
      flex: 1,
      gap: 2,
    },
    modalTitle: {
      color: theme.colors.cardForeground,
      fontSize: 18,
      fontFamily: "InterBold",
    },
    modalSubtitle: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: "InterMedium",
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    modeTabs: {
      flexDirection: "row",
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: radius.pill,
      backgroundColor: theme.colors.secondary,
      padding: 4,
    },
    modeTab: {
      flex: 1,
      minHeight: 36,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    modeTabActive: {
      backgroundColor: theme.colors.primary,
    },
    modeTabText: {
      color: theme.colors.mutedForeground,
      fontSize: 12,
      fontFamily: "InterBold",
    },
    modeTabTextActive: {
      color: theme.colors.primaryForeground,
    },
    monthHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.xs,
    },
    yearJumpButton: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
    },
    yearJumpText: {
      color: theme.colors.cardForeground,
      fontSize: 13,
      fontFamily: "InterBold",
    },
    monthTitle: {
      flex: 1,
      textAlign: "center",
      color: theme.colors.cardForeground,
      fontSize: 15,
      fontFamily: "InterBold",
    },
    weekdayRow: {
      flexDirection: "row",
    },
    weekdayText: {
      width: "14.2857%",
      textAlign: "center",
      color: theme.colors.mutedForeground,
      fontSize: 11,
      fontFamily: "InterBold",
    },
    calendarGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dayCell: {
      width: "14.2857%",
      aspectRatio: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.md,
    },
    emptyDayCell: {
      opacity: 0,
    },
    selectedDayCell: {
      backgroundColor: theme.colors.primary,
    },
    dayText: {
      color: theme.colors.cardForeground,
      fontSize: 14,
      fontFamily: "InterSemiBold",
    },
    selectedDayText: {
      color: theme.colors.primaryForeground,
    },
    unsupportedText: {
      color: theme.colors.destructive,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: "InterSemiBold",
      textAlign: "center",
      paddingVertical: spacing.lg,
    },
    modalFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    clearButton: {
      minHeight: 40,
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
    },
    clearButtonText: {
      color: theme.colors.destructive,
      fontSize: 13,
      fontFamily: "InterBold",
    },
    cancelButton: {
      minHeight: 40,
      justifyContent: "center",
      borderRadius: radius.pill,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: spacing.md,
    },
    cancelButtonText: {
      color: theme.colors.cardForeground,
      fontSize: 13,
      fontFamily: "InterBold",
    },
  });
