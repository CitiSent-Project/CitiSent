import { View } from "react-native";
import PageTopBar from "../layout/PageTopBar";
import RefreshableScrollView from "../ui/RefreshableScrollView";

export default function ProfileSubpageLayout({ title, refreshing, onRefresh, children }) {
  return (
    <View className="flex-1">
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
