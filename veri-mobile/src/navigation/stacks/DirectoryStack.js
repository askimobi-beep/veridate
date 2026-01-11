import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DirectoryScreen from "../../screens/directory/DirectoryScreen";
import DirectoryDetailScreen from "../../screens/directory/DirectoryDetailScreen";

const Stack = createNativeStackNavigator();

export default function DirectoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="DirectoryHome" component={DirectoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DirectoryDetail" component={DirectoryDetailScreen} options={{ title: "Profile" }} />
    </Stack.Navigator>
  );
}
