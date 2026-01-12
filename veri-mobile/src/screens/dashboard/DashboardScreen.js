import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import SectionCard from "../../components/common/SectionCard";
import DrawerToggleButton from "../../components/common/DrawerToggleButton";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const loadProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        if (alive) setProfile(res?.data?.profile || res?.data || null);
      } catch {
        if (alive) setProfile(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  const name = profile?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  const educationCount = Array.isArray(profile?.education) ? profile.education.length : 0;
  const experienceCount = Array.isArray(profile?.experience) ? profile.experience.length : 0;
  const projectsCount = Array.isArray(profile?.projects) ? profile.projects.length : 0;

  return (
    <ScreenContainer>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back${name ? `, ${name}` : ""}`}
        subtitle="Track your verified profile and directory visibility."
        left={<DrawerToggleButton />}
      />
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <SectionCard title="Profile progress" subtitle="Your current highlights">
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{educationCount}</Text>
                <Text style={styles.statLabel}>Education</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{experienceCount}</Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{projectsCount}</Text>
                <Text style={styles.statLabel}>Projects</Text>
              </View>
            </View>
            <Text style={styles.note}>
              Keep your sections updated to improve verification success.
            </Text>
          </SectionCard>

          <SectionCard title="Verification status" subtitle="Your visibility status">
            <Text style={styles.body}>
              {profile?.verified
                ? "Your profile is verified and visible in the directory."
                : "Complete your profile to request verification and appear in the directory."}
            </Text>
          </SectionCard>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.canvas,
    borderRadius: 16,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    alignItems: "center",
  },
  statValue: {
    fontFamily: typography.fontBold,
    fontSize: typography.h2,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  note: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
  },
  body: {
    fontFamily: typography.fontRegular,
    fontSize: typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
});
