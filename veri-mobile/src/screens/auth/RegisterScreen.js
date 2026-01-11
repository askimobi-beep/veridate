import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { spacing } from "../../theme/spacing";

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert("Missing info", "Fill in all fields to continue.");
      return;
    }
    try {
      setBusy(true);
      await register({ firstName, lastName, email, password });
      navigation.navigate("VerifyOtp", { email });
    } catch (error) {
      Alert.alert("Registration failed", error?.response?.data?.message || "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <PageHeader
            eyebrow="Create account"
            title="Build your verified profile"
            subtitle="Join Veridate to unlock verification and directory access."
          />
          <View style={{ paddingHorizontal: spacing.lg }}>
            <AppTextInput label="First name" value={firstName} onChangeText={setFirstName} />
            <AppTextInput label="Last name" value={lastName} onChangeText={setLastName} />
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
              placeholder="Create a strong password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <PrimaryButton title={busy ? "Creating..." : "Create account"} onPress={handleRegister} disabled={busy} />
            <PrimaryButton title="Back to login" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
