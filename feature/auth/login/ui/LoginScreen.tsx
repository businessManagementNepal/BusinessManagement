import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  PinIcon,
  User,
} from "lucide-react-native";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { colors } from "@/shared/components/theme/colors";

const languages = [
  { value: "en", label: "English" },
  { value: "ne", label: "नेपाली" },
  { value: "hi", label: "हिन्दी" },
  { value: "bn", label: "বাংলা" },
] as const;

interface AuthScreenProps {
  onSubmit?: () => void;

}

export function LoginScreen({ onSubmit }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLang, setSelectedLang] =
    useState<(typeof languages)[number]["value"]>("en");

  const selectedLanguageLabel = useMemo(() => {
    return (
      languages.find((language) => language.value === selectedLang)?.label ??
      "English"
    );
  }, [selectedLang]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.languagePill}>
            <Globe size={20} color={colors.primary} />
            <Text style={styles.languagePillText}>{selectedLanguageLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.logoBox}>
          <Text style={styles.logoText}>eL</Text>
        </View>

        <Text style={styles.brand}>eLekha</Text>
        <Text style={styles.brandSub}>Your Business & Finance Companion</Text>
      </View>

      <View style={styles.divider} />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.languageChipRow}>
            {languages.map((language) => {
              const isActive = selectedLang === language.value;

              return (
                <Pressable
                  key={language.value}
                  style={[
                    styles.languageChip,
                    isActive ? styles.languageChipActive : undefined,
                  ]}
                  onPress={() => setSelectedLang(language.value)}
                >
                  <Text
                    style={[
                      styles.languageChipText,
                      isActive ? styles.languageChipTextActive : undefined,
                    ]}
                  >
                    {language.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.tabSwitcher}>
            <Pressable
              style={[
                styles.tabButton,
                isLogin ? styles.tabButtonActive : undefined,
              ]}
              onPress={() => setIsLogin(true)}
            >
              <Text
                style={[
                  styles.tabText,
                  isLogin ? styles.tabTextActive : undefined,
                ]}
              >
                Login
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tabButton,
                !isLogin ? styles.tabButtonActive : undefined,
              ]}
              onPress={() => setIsLogin(false)}
            >
              <Text
                style={[
                  styles.tabText,
                  !isLogin ? styles.tabTextActive : undefined,
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            {!isLogin ? (
              <>
                <TextField
                  placeholder="Full Name"
                  leftIcon={<User size={22} color={colors.mutedForeground} />}
                />

                <TextField
                  placeholder="Phone Number"
                  leftIcon={<Phone size={22} color={colors.mutedForeground} />}
                />

                <TextField
                  placeholder="MPIN"
                  leftIcon={
                    <PinIcon size={22} color={colors.mutedForeground} />
                  }
                />
              </>
            ) : null}

            <TextField
              placeholder="Email Address"
              leftIcon={<Mail size={22} color={colors.mutedForeground} />}
            />

            <TextField
              placeholder="Password"
              secureTextEntry={!showPassword}
              leftIcon={<Lock size={22} color={colors.mutedForeground} />}
              rightIcon={
                <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? (
                    <EyeOff size={22} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={22} color={colors.mutedForeground} />
                  )}
                </Pressable>
              }
            />

            {isLogin ? (
              <Pressable style={styles.forgotWrapper}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>
            ) : null}

            <Pressable style={styles.primaryButton} onPress={onSubmit}>
              <Text style={styles.primaryButtonText}>
                {isLogin ? "Login" : "Create Account"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.socialRow}>
            <View style={styles.line} />
            <Text style={styles.socialLabel}>or continue with</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialButtons}>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialText}>Google</Text>
            </Pressable>

            <Pressable style={styles.socialButton}>
              <Text style={styles.socialText}>Apple</Text>
            </Pressable>
          </View>

          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text
              style={styles.footerLink}
              onPress={() => setIsLogin((prev) => !prev)}
            >
              {isLogin ? "Sign Up" : "Login"}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.header,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 56,
  },
  headerTopRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 42,
  },
  languagePill: {
    minWidth: 152,
    height: 56,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  languagePillText: {
    color: colors.foreground ?? "#1F2937",
    fontSize: 18,
    fontWeight: "700",
  },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  logoText: {
    color: colors.headerForeground,
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 48,
  },
  brand: {
    color: colors.headerForeground,
    fontSize: 52,
    fontWeight: "800",
    lineHeight: 58,
  },
  brandSub: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  divider: {
    height: 5,
    backgroundColor: colors.destructive,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 34,
  },
  languageChipRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  languageChip: {
    minWidth: 86,
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  languageChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageChipText: {
    color: colors.foreground ?? "#1F2937",
    fontSize: 16,
    fontWeight: "700",
  },
  languageChipTextActive: {
    color: colors.primaryForeground,
  },
  tabSwitcher: {
    backgroundColor: colors.muted,
    borderRadius: 30,
    padding: 6,
    flexDirection: "row",
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    minHeight: 86,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.mutedForeground,
    fontSize: 24,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.primaryForeground,
  },
  form: {
    gap: 18,
  },
  forgotWrapper: {
    alignSelf: "flex-end",
    marginTop: 2,
  },
  forgot: {
    color: colors.primary,
    textAlign: "right",
    fontSize: 17,
    fontWeight: "800",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 24,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontWeight: "800",
    fontSize: 22,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 34,
    marginBottom: 22,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  socialLabel: {
    color: colors.mutedForeground,
    fontSize: 16,
    fontWeight: "500",
  },
  socialButtons: {
    flexDirection: "row",
    gap: 16,
  },
  socialButton: {
    flex: 1,
    minHeight: 98,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  socialText: {
    color: colors.foreground ?? "#1F2937",
    fontSize: 24,
    fontWeight: "700",
  },
  footerText: {
    textAlign: "center",
    color: colors.mutedForeground,
    fontSize: 17,
    marginTop: 30,
    fontWeight: "500",
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "800",
  },
});
