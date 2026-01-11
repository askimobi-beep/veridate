import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OrgDashboardScreen from "../../screens/org/OrgDashboardScreen";
import OrgMembersScreen from "../../screens/org/OrgMembersScreen";

const Stack = createNativeStackNavigator();

export default function OrgStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="OrgDashboard" component={OrgDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="OrgMembers" component={OrgMembersScreen} options={{ title: "Members" }} />
    </Stack.Navigator>
  );
}
