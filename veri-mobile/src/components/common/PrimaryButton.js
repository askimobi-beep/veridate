import { Pressable, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

export default function PrimaryButton({ title, onPress, variant = "primary", style, ...props }) {
  const isGhost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, isGhost && styles.ghostText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontFamily: typography.fontMedium,
    fontSize: typography.body,
    color: "#FFFFFF",
  },
  ghostText: {
    color: colors.ink,
  },
  pressed: {
    opacity: 0.86,
  },
});
