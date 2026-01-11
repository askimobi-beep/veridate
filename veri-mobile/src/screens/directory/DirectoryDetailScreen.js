import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import SectionCard from "../../components/common/SectionCard";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import api from "../../services/api";

export default function DirectoryDetailScreen({ route }) {
  const { userId, profile } = route.params || {};
  const [data, setData] = useState(profile || null);
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    let alive = true;
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const res = await api.get(`/profile/getonid/${userId}`);
        if (alive) setData(res?.data?.profile || res?.data || null);
      } catch (error) {
        if (alive) setData(profile || null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      alive = false;
    };
  }, [userId, profile]);

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  const name = data?.name || `${data?.firstName || ""} ${data?.lastName || ""}`.trim();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.name}>{name || "Verified profile"}</Text>
          <Text style={styles.title}>{data?.title || data?.headline || "Verified member"}</Text>
          <Text style={styles.meta}>{data?.location || "Pakistan"}</Text>
        </View>

        <SectionCard title="About" subtitle="Summary and highlights">
          <Text style={styles.body}>{data?.summary || data?.bio || "No summary provided yet."}</Text>
        </SectionCard>

        <SectionCard title="Experience" subtitle="Roles and tenure">
          {(data?.experience || []).length ? (
            data.experience.map((exp, idx) => (
              <View key={`${exp?.title}-${idx}`} style={styles.row}>
                <Text style={styles.rowTitle}>{exp?.title || "Role"}</Text>
                <Text style={styles.rowMeta}>{exp?.company || "Company"}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.body}>No experience listed yet.</Text>
          )}
        </SectionCard>

        <SectionCard title="Education" subtitle="Degrees and institutions">
          {(data?.education || []).length ? (
            data.education.map((edu, idx) => (
              <View key={`${edu?.degree}-${idx}`} style={styles.row}>
                <Text style={styles.rowTitle}>{edu?.degree || "Degree"}</Text>
                <Text style={styles.rowMeta}>{edu?.institute || "Institution"}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.body}>No education listed yet.</Text>
          )}
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  name: {
    fontFamily: typography.fontBold,
    fontSize: typography.h1,
    color: colors.ink,
  },
  title: {
    fontFamily: typography.fontMedium,
    fontSize: typography.h3,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  meta: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  body: {
    fontFamily: typography.fontRegular,
    fontSize: typography.body,
    color: colors.ink,
    lineHeight: 22,
  },
  row: {
    marginBottom: spacing.sm,
  },
  rowTitle: {
    fontFamily: typography.fontMedium,
    fontSize: typography.body,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
