import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

const sections = [
  { title: "Personal info", subtitle: "Contact details and identity", route: "PersonalInfo" },
  { title: "Education", subtitle: "Degrees and certificates", route: "Education" },
  { title: "Experience", subtitle: "Roles and timelines", route: "Experience" },
  { title: "Projects", subtitle: "Portfolio highlights", route: "Projects" },
  { title: "Documents", subtitle: "Uploads and verification", route: "Documents" },
  { title: "Preview", subtitle: "Public profile view", route: "ProfilePreview" },
];

export default function ProfileHomeScreen({ navigation }) {
  return (
    <ScreenContainer>
      <PageHeader
        eyebrow="Profile builder"
        title="Craft your verified profile"
        subtitle="Complete each section to unlock verification and visibility."
      />
      <View style={styles.container}>
        {sections.map((section) => (
          <Pressable key={section.route} onPress={() => navigation.navigate(section.route)}>
            <SectionCard title={section.title} subtitle={section.subtitle} />
          </Pressable>
        ))}
        <View style={styles.progress}>
          <Text style={styles.progressText}>Profile completion: 0%</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  progress: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressText: {
    fontFamily: typography.fontMedium,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    width: "10%",
    backgroundColor: colors.primary,
  },
});
