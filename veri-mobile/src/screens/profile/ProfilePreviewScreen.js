import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import SectionCard from "../../components/common/SectionCard";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import api from "../../services/api";

export default function ProfilePreviewScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        if (alive) setData(res?.data?.profile || res?.data || null);
      } catch (error) {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      alive = false;
    };
  }, []);

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
          <Text style={styles.name}>{name || "Your profile"}</Text>
          <Text style={styles.title}>{data?.title || data?.headline || "Add your role"}</Text>
          <Text style={styles.meta}>{data?.location || "Pakistan"}</Text>
        </View>

        <SectionCard title="Summary" subtitle="How you show up publicly">
          <Text style={styles.body}>{data?.summary || data?.bio || "Tell the world about your skills."}</Text>
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
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
