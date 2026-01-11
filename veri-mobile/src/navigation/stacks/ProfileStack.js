import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileHomeScreen from "../../screens/profile/ProfileHomeScreen";
import PersonalInfoScreen from "../../screens/profile/PersonalInfoScreen";
import EducationScreen from "../../screens/profile/EducationScreen";
import ExperienceScreen from "../../screens/profile/ExperienceScreen";
import ProjectsScreen from "../../screens/profile/ProjectsScreen";
import DocumentsScreen from "../../screens/profile/DocumentsScreen";
import ProfilePreviewScreen from "../../screens/profile/ProfilePreviewScreen";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: "Personal Info" }} />
      <Stack.Screen name="Education" component={EducationScreen} options={{ title: "Education" }} />
      <Stack.Screen name="Experience" component={ExperienceScreen} options={{ title: "Experience" }} />
      <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: "Projects" }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: "Documents" }} />
      <Stack.Screen name="ProfilePreview" component={ProfilePreviewScreen} options={{ title: "Preview" }} />
    </Stack.Navigator>
  );
}
