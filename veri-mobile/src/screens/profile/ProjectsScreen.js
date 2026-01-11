import { useState } from "react";
import { Alert, ScrollView } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import AppTextInput from "../../components/common/AppTextInput";
import PrimaryButton from "../../components/common/PrimaryButton";
import SectionCard from "../../components/common/SectionCard";
import { spacing } from "../../theme/spacing";
import api from "../../services/api";

export default function ProjectsScreen() {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    try {
      setBusy(true);
      await api.post("/profile/save-projects", {
        projects: [
          {
            title: name,
            description: summary,
            link,
          },
        ],
      });
      Alert.alert("Saved", "Project details updated.");
    } catch (error) {
      Alert.alert("Save failed", error?.response?.data?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenContainer gradient={false}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <SectionCard title="Projects" subtitle="Highlight your best work">
          <AppTextInput label="Project name" value={name} onChangeText={setName} />
          <AppTextInput label="Summary" value={summary} onChangeText={setSummary} />
          <AppTextInput label="Project link" value={link} onChangeText={setLink} autoCapitalize="none" />
          <PrimaryButton title={busy ? "Saving..." : "Save project"} onPress={handleSave} disabled={busy} />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
