import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import SectionCard from "../../components/common/SectionCard";
import { spacing } from "../../theme/spacing";
import api from "../../services/api";

export default function EducationScreen() {
  const [degree, setDegree] = useState("");
  const [institute, setInstitute] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [grade, setGrade] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    try {
      setBusy(true);
      const form = new FormData();
      form.append("education[0][degree]", degree);
      form.append("education[0][institute]", institute);
      form.append("education[0][startDate]", startDate);
      form.append("education[0][endDate]", endDate);
      form.append("education[0][gradeOrCgpa]", grade);

      await api.post("/profile/save-education", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Saved", "Education details updated.");
    } catch (error) {
      Alert.alert("Save failed", error?.response?.data?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer gradient={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <SectionCard title="Education" subtitle="Degrees and certifications">
          <AppTextInput label="Degree" value={degree} onChangeText={setDegree} />
          <AppTextInput label="Institute" value={institute} onChangeText={setInstitute} />
          <AppTextInput label="Start date" value={startDate} onChangeText={setStartDate} />
          <AppTextInput label="End date" value={endDate} onChangeText={setEndDate} />
          <AppTextInput label="Grade / CGPA" value={grade} onChangeText={setGrade} />
          <PrimaryButton title={busy ? "Saving..." : "Save education"} onPress={handleSave} disabled={busy} />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
