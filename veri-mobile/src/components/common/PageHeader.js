import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export default function PageHeader({ eyebrow, title, subtitle, right }) {
  return (
    <View style={styles.container}>
      <View style={styles.textBlock}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  textBlock: {
    flex: 1,
    paddingRight: spacing.md,
  },
  eyebrow: {
    fontFamily: typography.fontMedium,
    fontSize: typography.small,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  title: {
    fontFamily: typography.fontBold,
    fontSize: typography.h1,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontRegular,
    fontSize: typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  right: {
    marginTop: spacing.sm,
  },
});
