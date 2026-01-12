import { useNavigation } from "@react-navigation/native";
import IconButton from "./IconButton";

export default function DrawerToggleButton() {
  const navigation = useNavigation();
  const handlePress = () => {
    const parent = navigation.getParent();
    if (parent?.openDrawer) {
      parent.openDrawer();
      return;
    }
    navigation.getParent()?.getParent?.()?.openDrawer?.();
  };
  return <IconButton name="menu-outline" onPress={handlePress} />;
}
