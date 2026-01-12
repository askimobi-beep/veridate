import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import ScreenContainer from "../../components/common/ScreenContainer";
import PageHeader from "../../components/common/PageHeader";
import DrawerToggleButton from "../../components/common/DrawerToggleButton";
import PrimaryButton from "../../components/common/PrimaryButton";
import SectionCard from "../../components/common/SectionCard";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export default function DocumentsScreen() {
  const [resumeName] = useState("No file selected");
  const [educationName] = useState("No file selected");

  const handleUpload = () => {
    Alert.alert("Upload", "File upload will be added with expo-document-picker.");
  };

  return (
    <ScreenContainer gradient={false}>
      <PageHeader
        eyebrow="Profile"
        title="Documents"
        subtitle="Upload supporting files for verification."
        left={<DrawerToggleButton />}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <SectionCard title="Documents" subtitle="Upload proof for verification">
          <View style={styles.block}>
            <Text style={styles.label}>Resume</Text>
            <Text style={styles.value}>{resumeName}</Text>
            <PrimaryButton title="Upload resume" onPress={handleUpload} />
          </View>
          <View style={styles.block}>
            <Text style={styles.label}>Education certificates</Text>
            <Text style={styles.value}>{educationName}</Text>
            <PrimaryButton title="Upload certificates" onPress={handleUpload} />
          </View>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: typography.fontMedium,
    fontSize: typography.body,
    color: colors.ink,
  },
  value: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
});
