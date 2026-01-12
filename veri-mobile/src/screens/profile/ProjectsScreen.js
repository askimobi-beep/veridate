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

export default function ProjectsScreen() {
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const loadProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        const profile = res?.data?.profile || res?.data || {};
        const projectList = Array.isArray(profile?.projects)
          ? profile.projects
          : profile?.projects
          ? [profile.projects]
          : [];
        const project = projectList[0] || {};
        if (alive) {
          setName(project?.projectTitle || project?.title || "");
          setSummary(project?.description || project?.summary || "");
          setLink(project?.projectUrl || project?.link || "");
        }
      } catch {
        if (alive) {
          setName("");
          setSummary("");
          setLink("");
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
      <PageHeader
        eyebrow="Profile"
        title="Projects"
        subtitle="Showcase your best work."
        left={<DrawerToggleButton />}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <SectionCard title="Projects" subtitle="Highlight your best work">
          <AppTextInput label="Project name" value={name} onChangeText={setName} />
          <AppTextInput label="Summary" placeholder="Short project summary" value={summary} onChangeText={setSummary} />
          <AppTextInput
            label="Project link"
            placeholder="https://"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
          />
          <PrimaryButton
            title={busy ? "Saving..." : "Save project"}
            onPress={handleSave}
            disabled={busy || loading}
          />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}
