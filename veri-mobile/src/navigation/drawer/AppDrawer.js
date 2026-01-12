import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DirectoryStack from "../stacks/DirectoryStack";
import ProfileStack from "../stacks/ProfileStack";
import OrgStack from "../stacks/OrgStack";
import SettingsStack from "../stacks/SettingsStack";
import DashboardScreen from "../../screens/dashboard/DashboardScreen";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import { typography } from "../../theme/typography";

const Drawer = createDrawerNavigator();

const screenOptions = {
  headerShown: false,
  drawerActiveTintColor: colors.primary,
  drawerInactiveTintColor: colors.muted,
  drawerStyle: {
    backgroundColor: colors.card,
    borderRightColor: colors.border,
  },
  drawerLabelStyle: {
    fontFamily: typography.fontMedium,
    fontSize: typography.body,
  },
};

function DrawerContent(props) {
  const { user, logout } = useAuth();
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.firstName?.[0] || "V"}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.name}>
            {user?.firstName || ""} {user?.lastName || ""}
          </Text>
          <Text style={styles.email}>{user?.email || ""}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <DrawerItem
          label="Dashboard"
          icon={({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Dashboard")}
        />
        <DrawerItem
          label="Directory"
          icon={({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Directory")}
        />
        <DrawerItem
          label="Profile"
          icon={({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Profile")}
        />
        <DrawerItem
          label="Education"
          icon={({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Profile", { screen: "Education" })}
        />
        <DrawerItem
          label="Experience"
          icon={({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Profile", { screen: "Experience" })}
        />
        <DrawerItem
          label="Projects"
          icon={({ color, size }) => <Ionicons name="layers-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Profile", { screen: "Projects" })}
        />
        <DrawerItem
          label="Organization"
          icon={({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Organization")}
        />
        <DrawerItem
          label="Settings"
          icon={({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />}
          onPress={() => props.navigation.navigate("Settings")}
        />
      </View>

      <View style={styles.footer}>
        <DrawerItem
          label="Log out"
          icon={({ color, size }) => <Ionicons name="log-out-outline" size={size} color={color} />}
          onPress={logout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppDrawer() {
  return (
    <Drawer.Navigator screenOptions={screenOptions} drawerContent={(props) => <DrawerContent {...props} />}>
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Directory" component={DirectoryStack} />
      <Drawer.Screen name="Profile" component={ProfileStack} />
      <Drawer.Screen name="Organization" component={OrgStack} />
      <Drawer.Screen name="Settings" component={SettingsStack} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flexGrow: 1,
    paddingVertical: spacing.lg,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontFamily: typography.fontBold,
    fontSize: typography.h3,
    color: colors.accent,
  },
  profileText: {
    flex: 1,
  },
  name: {
    fontFamily: typography.fontMedium,
    fontSize: typography.h3,
    color: colors.ink,
  },
  email: {
    fontFamily: typography.fontRegular,
    fontSize: typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.sm,
  },
  footer: {
    marginTop: "auto",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },
});
