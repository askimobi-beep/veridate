import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import SectionCard from "../../components/common/SectionCard";
import { spacing } from "../../theme/spacing";
import api from "../../services/api";

export default function PersonalInfoScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    try {
      setBusy(true);
      const form = new FormData();
      form.append("firstName", firstName);
      form.append("lastName", lastName);
      form.append("email", email);
      form.append("contact", contact);
      form.append("address", address);

      await api.post("/profile/save-personal-info", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Saved", "Personal information updated.");
    } catch (error) {
      Alert.alert("Save failed", error?.response?.data?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer gradient={false}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
          <SectionCard title="Personal details" subtitle="Public profile basics">
            <AppTextInput label="First name" value={firstName} onChangeText={setFirstName} />
            <AppTextInput label="Last name" value={lastName} onChangeText={setLastName} />
            <AppTextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
            <AppTextInput label="Contact number" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
            <AppTextInput label="Address" value={address} onChangeText={setAddress} />
            <PrimaryButton title={busy ? "Saving..." : "Save changes"} onPress={handleSave} disabled={busy} />
          </SectionCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
