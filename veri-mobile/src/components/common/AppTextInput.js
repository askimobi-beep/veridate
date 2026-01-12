import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export default function AppTextInput({ label, hint, ...props }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.muted}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontMedium,
    fontSize: typography.small,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: typography.body,
    color: colors.ink,
    fontFamily: typography.fontRegular,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  hint: {
    marginTop: spacing.xs,
    fontSize: typography.small,
    color: colors.muted,
    fontFamily: typography.fontRegular,
  },
});
