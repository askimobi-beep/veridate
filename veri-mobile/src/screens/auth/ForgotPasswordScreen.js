import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import api from "../../services/api";
import { spacing } from "../../theme/spacing";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Missing info", "Enter your email address.");
      return;
    }
    try {
      setBusy(true);
      await api.post("/auth/forgot-password", { email });
      Alert.alert("Check your email", "We sent a reset link to your inbox.");
    } catch (error) {
      Alert.alert("Request failed", error?.response?.data?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <PageHeader
            eyebrow="Reset"
            title="Forgot your password?"
            subtitle="We will email you a reset link."
          />
          <View style={{ paddingHorizontal: spacing.lg }}>
            <AppTextInput
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <PrimaryButton title={busy ? "Sending..." : "Send reset link"} onPress={handleSubmit} disabled={busy} />
            <PrimaryButton title="Back" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
