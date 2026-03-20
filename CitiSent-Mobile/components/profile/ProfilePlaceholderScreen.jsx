import { View } from "react-native";
import PageTopBar from "../layout/PageTopBar";
import UnderConstructionContent from "./UnderConstructionContent";
import { Colors } from "../../modules/shared";

export default function ProfilePlaceholderScreen({ title }) {
  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.profileSubpage }}>
      <PageTopBar title={title} />
      <UnderConstructionContent />
    </View>
  );
}
