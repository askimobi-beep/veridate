import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";
import api from "../../services/api";

const SAMPLE = [
  { _id: "1", name: "Ayesha Khan", title: "Product Designer", location: "Lahore" },
  { _id: "2", name: "Hamza Ali", title: "Full Stack Engineer", location: "Karachi" },
  { _id: "3", name: "Mehak Raza", title: "Data Analyst", location: "Islamabad" },
];

export default function DirectoryScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetchProfiles = async () => {
      try {
        const res = await api.get("/profile/directory");
        if (alive) setProfiles(res?.data?.profiles || res?.data || SAMPLE);
      } catch (error) {
        if (alive) setProfiles(SAMPLE);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchProfiles();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = profiles.filter((item) => {
    const name = item?.name || `${item?.firstName || ""} ${item?.lastName || ""}`.trim();
    return name.toLowerCase().includes(query.toLowerCase()) || (item?.title || "").toLowerCase().includes(query.toLowerCase());
  });

  return (
    <ScreenContainer>
      <PageHeader
        eyebrow="Directory"
        title="Verified profiles"
        subtitle="Search trusted profiles and explore verified talent."
      />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search by name or role"
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = item?.name || `${item?.firstName || ""} ${item?.lastName || ""}`.trim();
            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate("DirectoryDetail", { userId: item?.user || item?._id, profile: item })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{name?.slice(0, 1) || "V"}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{name || "Verified Profile"}</Text>
                  <Text style={styles.title}>{item?.title || item?.headline || "Verified member"}</Text>
                  <Text style={styles.location}>{item?.location || "Pakistan"}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: typography.fontRegular,
    fontSize: typography.body,
    color: colors.ink,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  avatar: {
    height: 54,
    width: 54,
    borderRadius: 27,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: typography.fontBold,
    fontSize: typography.h2,
    color: colors.accent,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: typography.fontMedium,
    fontSize: typography.h3,
    color: colors.ink,
  },
  title: {
    fontFamily: typography.fontRegular,
    fontSize: typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  location: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
