import { useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import DrawerToggleButton from "../../components/common/DrawerToggleButton";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const loadProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        const profile = res?.data?.profile || res?.data || {};
        const eduList = Array.isArray(profile?.education)
          ? profile.education
          : profile?.education
          ? [profile.education]
          : [];
        const edu = eduList[0] || {};
        if (alive) {
          setDegree(edu?.degreeTitle || edu?.degree || "");
          setInstitute(edu?.institute || "");
          setStartDate(edu?.startDate || "");
          setEndDate(edu?.endDate || "");
          setGrade(edu?.gradeOrCgpa || edu?.grade || "");
        }
      } catch {
        if (alive) {
          setDegree("");
          setInstitute("");
          setStartDate("");
          setEndDate("");
          setGrade("");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

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
      <PageHeader
        eyebrow="Profile"
        title="Education"
        subtitle="Add your degrees and certifications."
        left={<DrawerToggleButton />}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <SectionCard title="Education" subtitle="Degrees and certifications">
          <AppTextInput label="Degree" value={degree} onChangeText={setDegree} />
          <AppTextInput label="Institute" value={institute} onChangeText={setInstitute} />
          <AppTextInput label="Start date" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
          <AppTextInput label="End date" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
          <AppTextInput label="Grade / CGPA" placeholder="e.g. 3.7" value={grade} onChangeText={setGrade} />
          <PrimaryButton
            title={busy ? "Saving..." : "Save education"}
            onPress={handleSave}
            disabled={busy || loading}
          />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
