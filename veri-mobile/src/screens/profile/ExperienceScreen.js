import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import SectionCard from "../../components/common/SectionCard";
import { spacing } from "../../theme/spacing";
import api from "../../services/api";

export default function ExperienceScreen() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    try {
      setBusy(true);
      const form = new FormData();
      form.append("experience[0][title]", title);
      form.append("experience[0][company]", company);
      form.append("experience[0][startDate]", startDate);
      form.append("experience[0][endDate]", endDate);
      form.append("experience[0][location]", location);

      await api.post("/profile/save-experience", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Saved", "Experience updated.");
    } catch (error) {
      Alert.alert("Save failed", error?.response?.data?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer gradient={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <SectionCard title="Experience" subtitle="Add your most recent role">
          <AppTextInput label="Role title" value={title} onChangeText={setTitle} />
          <AppTextInput label="Company" value={company} onChangeText={setCompany} />
          <AppTextInput label="Start date" value={startDate} onChangeText={setStartDate} />
          <AppTextInput label="End date" value={endDate} onChangeText={setEndDate} />
          <AppTextInput label="Location" value={location} onChangeText={setLocation} />
          <PrimaryButton title={busy ? "Saving..." : "Save experience"} onPress={handleSave} disabled={busy} />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
