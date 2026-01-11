import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export default function OtpVerifyScreen({ navigation, route }) {
  const { verifyOtp } = useAuth();
  const [email, setEmail] = useState(route?.params?.email || "");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const handleVerify = async () => {
    if (!email || !otp) {
      Alert.alert("Missing info", "Enter the email and OTP code.");
      return;
    }
    try {
      setBusy(true);
      await verifyOtp({ email, otp });
      Alert.alert("Verified", "Your email is verified. Please login.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Verification failed", error?.response?.data?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
          <PageHeader
            eyebrow="Verify"
            title="Enter your OTP code"
            subtitle="We sent a 6-digit code to your email."
          />
          <View style={{ paddingHorizontal: spacing.lg }}>
            <AppTextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <AppTextInput label="OTP code" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
            <PrimaryButton title={busy ? "Verifying..." : "Verify"} onPress={handleVerify} disabled={busy} />
            <Text style={styles.helper} onPress={() => navigation.navigate("Login")}>
              Back to login
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  helper: {
    textAlign: "center",
    marginTop: spacing.md,
    fontFamily: typography.fontMedium,
    color: colors.primaryDark,
  },
});
