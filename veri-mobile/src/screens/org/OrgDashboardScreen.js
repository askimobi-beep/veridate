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

export default function OrgDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/organizations/dashboard");
        if (alive) setStats(res?.data || null);
      } catch (error) {
        if (alive) setStats(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchDashboard();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ScreenContainer>
      <PageHeader
        eyebrow="Organization"
        title="Organization dashboard"
        subtitle="Monitor verified members and pending requests."
        left={<DrawerToggleButton />}
      />

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <SectionCard title="Overview" subtitle="Verification snapshots">
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats?.totalMembers || 0}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats?.verified || 0}</Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats?.pending || 0}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard title="Members" subtitle="View organization roster">
            <Text style={styles.link} onPress={() => navigation.navigate("OrgMembers")}>View members list</Text>
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
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    borderRadius: 16,
    marginRight: spacing.sm,
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
  link: {
    fontFamily: typography.fontMedium,
    fontSize: typography.body,
    color: colors.primary,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
