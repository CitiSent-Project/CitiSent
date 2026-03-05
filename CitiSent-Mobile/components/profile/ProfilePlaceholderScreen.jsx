import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageTopBar from "../layout/PageTopBar";
import UnderConstructionContent from "./UnderConstructionContent";

export default function ProfilePlaceholderScreen({ title }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <PageTopBar title={title} />
      <UnderConstructionContent />
    </View>
  );
}
