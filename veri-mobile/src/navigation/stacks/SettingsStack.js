import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SettingsScreen from "../../screens/profile/SettingsScreen";

const Stack = createNativeStackNavigator();

export default function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
