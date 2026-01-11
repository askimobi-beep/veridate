import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import api from "../../services/api";
import { spacing } from "../../theme/spacing";

export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    if (!token || !password) {
      Alert.alert("Missing info", "Enter the reset token and a new password.");
      return;
    }
    try {
      setBusy(true);
      await api.post("/auth/reset-password", { token, newPassword: password });
      Alert.alert("Password updated", "You can now log in with the new password.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Reset failed", error?.response?.data?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <PageHeader
            eyebrow="Secure"
            title="Reset your password"
            subtitle="Paste the token from your email and set a new password."
          />
          <View style={{ paddingHorizontal: spacing.lg }}>
            <AppTextInput label="Reset token" value={token} onChangeText={setToken} />
            <AppTextInput label="New password" value={password} onChangeText={setPassword} secureTextEntry />
            <PrimaryButton title={busy ? "Updating..." : "Update password"} onPress={handleReset} disabled={busy} />
            <PrimaryButton title="Back" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
