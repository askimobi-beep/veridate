import { ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import PrimaryButton from "../../components/common/PrimaryButton";
import SectionCard from "../../components/common/SectionCard";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  return (
    <ScreenContainer>
      <PageHeader eyebrow="Account" title="Settings" subtitle="Manage your profile and session." />
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard title="Profile" subtitle="Signed in as">
          <Text style={styles.name}>{user?.firstName || ""} {user?.lastName || ""}</Text>
          <Text style={styles.meta}>{user?.email || ""}</Text>
        </SectionCard>
        <SectionCard title="Security" subtitle="Session control">
          <PrimaryButton title="Log out" onPress={logout} />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
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
});
