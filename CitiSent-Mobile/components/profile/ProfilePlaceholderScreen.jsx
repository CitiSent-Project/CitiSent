import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageTopBar from "../layout/PageTopBar";
import UnderConstructionContent from "./UnderConstructionContent";
import { Colors } from "../../constants/colors";

export default function ProfilePlaceholderScreen({ title }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: Colors.screen.profileSubpage }}>
      <PageTopBar title={title} />
      <UnderConstructionContent />
    </View>
  );
}
