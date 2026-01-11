import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import api from "../../services/api";

export default function OrgMembersScreen() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchMembers = async () => {
      try {
        const res = await api.get("/organizations");
        if (alive) setMembers(res?.data?.organizations || res?.data || []);
      } catch (error) {
        if (alive) setMembers([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchMembers();
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

  return (
    <ScreenContainer>
      <FlatList
        contentContainerStyle={styles.list}
        data={members}
        keyExtractor={(item, idx) => item?._id || `${idx}`}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item?.organizationName || item?.name || "Organization"}</Text>
            <Text style={styles.meta}>{item?.email || ""}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No members found yet.</Text>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    fontFamily: typography.fontMedium,
    fontSize: typography.h3,
    color: colors.ink,
  },
  meta: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    fontFamily: typography.fontRegular,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
