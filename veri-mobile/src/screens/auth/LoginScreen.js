import { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter email and password to continue.");
      return;
    }
    try {
      setBusy(true);
      await login({ email, password });
    } catch (error) {
      Alert.alert("Login failed", error?.response?.data?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.brandBlock}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} />
          </View>

          <PageHeader
            eyebrow="Welcome back"
            title="Sign in to your account"
            subtitle="Access verified profiles, directories, and your dashboard."
          />

          <View style={styles.form}>
            <AppTextInput
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <AppTextInput
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <PrimaryButton title={busy ? "Signing in..." : "Sign in"} onPress={handleLogin} disabled={busy} />
            <PrimaryButton
              title="Create account"
              variant="ghost"
              onPress={() => navigation.navigate("Register")}
              style={styles.ghost}
            />
            <Text style={styles.link} onPress={() => navigation.navigate("ForgotPassword")}>
              Forgot your password?
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  brandBlock: {
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  logo: {
    width: 68,
    height: 68,
    resizeMode: "contain",
  },
  form: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  link: {
    textAlign: "center",
    marginTop: spacing.md,
    fontFamily: typography.fontMedium,
    color: colors.primaryDark,
  },
  ghost: {
    marginTop: spacing.sm,
  },
});

