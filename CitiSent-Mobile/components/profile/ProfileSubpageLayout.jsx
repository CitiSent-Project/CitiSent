import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageTopBar from "../layout/PageTopBar";
import RefreshableScrollView from "../ui/RefreshableScrollView";
import { Colors } from "../../constants/colors";

export default function ProfileSubpageLayout({ title, refreshing, onRefresh, children }) {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: Colors.screen.profileSubpage }}>
      <PageTopBar title={title} />
      <RefreshableScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {children}
      </RefreshableScrollView>
    </View>
  );
}
