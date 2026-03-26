import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { TextField } from "@/shared/components/reusable/Form/TextField";
import { colors } from "@/shared/components/theme/colors";

interface LoginScreenProps {
  onSubmit: () => void | Promise<void>;
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
  isSubmitting: boolean;
  submitError?: string;
  onForgotPasswordPress?: () => void;
  onSignUpPress?: () => void;
}

export function LoginScreen({
  onSubmit,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  isPasswordVisible,
  onTogglePasswordVisibility,
  isSubmitting,
  submitError,
  onForgotPasswordPress,
  onSignUpPress,
}: LoginScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>eL</Text>
        </View>

        <Text style={styles.brand}>eLekha</Text>
        <Text style={styles.brandSub}>Your Business and Finance Companion</Text>
      </View>

      <View style={styles.divider} />

      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Login</Text>

          <View style={styles.form}>
            <TextField
              placeholder="Email Address"
              leftIcon={<Mail size={20} color={colors.mutedForeground} />}
              value={email}
              onChangeText={onEmailChange}
              keyboardType="email-address"
            />

            <TextField
              placeholder="Password"
              secureTextEntry={!isPasswordVisible}
              leftIcon={<Lock size={20} color={colors.mutedForeground} />}
              value={password}
              onChangeText={onPasswordChange}
              rightIcon={
                <Pressable
                  onPress={onTogglePasswordVisibility}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle password visibility"
                >
                  {isPasswordVisible ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </Pressable>
              }
            />

            {onForgotPasswordPress ? (
              <Pressable style={styles.forgotWrapper} onPress={onForgotPasswordPress}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>
            ) : null}

            {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

            <Pressable
              style={[
                styles.primaryButton,
                isSubmitting ? styles.primaryButtonDisabled : undefined,
              ]}
              onPress={onSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? "Please wait..." : "Login"}
              </Text>
            </Pressable>
          </View>

          {onSignUpPress ? (
            <Text style={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Text style={styles.footerLink} onPress={onSignUpPress}>
                Sign Up
              </Text>
            </Text>
          ) : null}
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
    paddingBottom: 42,
  },
  logoBox: {
    width: 86,
    height: 86,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  logoText: {
    color: colors.headerForeground,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 38,
  },
  brand: {
    color: colors.headerForeground,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  brandSub: {
    color: "rgba(255,255,255,0.84)",
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  divider: {
    height: 4,
    backgroundColor: colors.destructive,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 34,
  },
  title: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  forgotWrapper: {
    alignSelf: "flex-end",
    marginTop: 2,
  },
  forgot: {
    color: colors.primary,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
  },
  submitError: {
    color: colors.destructive,
    fontSize: 14,
    fontWeight: "600",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontWeight: "800",
    fontSize: 16,
  },
  footerText: {
    textAlign: "center",
    color: colors.mutedForeground,
    fontSize: 14,
    marginTop: 24,
    fontWeight: "500",
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "800",
  },
});
