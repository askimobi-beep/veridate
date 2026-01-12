import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import PrimaryButton from "./PrimaryButton";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (__DEV__) {
      console.error("App error:", error);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>Please relaunch the app.</Text>
        <PrimaryButton title="Try again" onPress={this.handleReset} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
    padding: 24,
  },
  title: {
    fontFamily: typography.fontBold,
    fontSize: 20,
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fontRegular,
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
    textAlign: "center",
  },
});
