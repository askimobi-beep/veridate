import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import DirectoryStack from "../stacks/DirectoryStack";
import ProfileStack from "../stacks/ProfileStack";
import OrgStack from "../stacks/OrgStack";
import SettingsStack from "../stacks/SettingsStack";
import { colors } from "../../theme/colors";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, size }) => {
          let icon = "grid-outline";
          if (route.name === "Directory") icon = "search-outline";
          if (route.name === "Profile") icon = "person-circle-outline";
          if (route.name === "Organization") icon = "briefcase-outline";
          if (route.name === "Settings") icon = "settings-outline";
          return <Ionicons name={icon} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Directory" component={DirectoryStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
      <Tab.Screen name="Organization" component={OrgStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
