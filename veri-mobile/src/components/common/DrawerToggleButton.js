import { DrawerActions, useNavigation } from "@react-navigation/native";
import IconButton from "./IconButton";

export default function DrawerToggleButton() {
  const navigation = useNavigation();
  const handlePress = () => {
    if (navigation?.openDrawer) {
      navigation.openDrawer();
      return;
    }
    navigation.dispatch(DrawerActions.openDrawer());
  };
  return <IconButton name="menu-outline" onPress={handlePress} />;
}
