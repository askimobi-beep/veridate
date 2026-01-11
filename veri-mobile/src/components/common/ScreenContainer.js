import { SafeAreaView, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";

export default function ScreenContainer({ children, gradient = true }) {
  if (!gradient) {
    return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
  }

  return (
    <LinearGradient
      colors={["#F9F4EA", "#F6F7FB"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flex: 1,
  },
});
