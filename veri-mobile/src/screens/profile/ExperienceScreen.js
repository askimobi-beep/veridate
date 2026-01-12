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

export default function ExperienceScreen() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const loadProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        const profile = res?.data?.profile || res?.data || {};
        const expList = Array.isArray(profile?.experience)
          ? profile.experience
          : profile?.experience
          ? [profile.experience]
          : [];
        const exp = expList[0] || {};
        if (alive) {
          setTitle(exp?.jobTitle || exp?.title || "");
          setCompany(exp?.company || "");
          setStartDate(exp?.startDate || "");
          setEndDate(exp?.endDate || "");
          setLocation(exp?.location || "");
        }
      } catch {
        if (alive) {
          setTitle("");
          setCompany("");
          setStartDate("");
          setEndDate("");
          setLocation("");
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
      <PageHeader
        eyebrow="Profile"
        title="Experience"
        subtitle="Highlight your most recent roles."
        left={<DrawerToggleButton />}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <SectionCard title="Experience" subtitle="Add your most recent role">
          <AppTextInput label="Role title" value={title} onChangeText={setTitle} />
          <AppTextInput label="Company" value={company} onChangeText={setCompany} />
          <AppTextInput label="Start date" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
          <AppTextInput label="End date" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
          <AppTextInput label="Location" value={location} onChangeText={setLocation} />
          <PrimaryButton
            title={busy ? "Saving..." : "Save experience"}
            onPress={handleSave}
            disabled={busy || loading}
          />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
