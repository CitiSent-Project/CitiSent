import { Text, View } from "react-native";
import { AuthCityFooter } from "../../modules/auth";
import { CreateReportTopBar, IssueGrid } from "../../modules/createReport";
import { Colors } from "../../modules/shared";

export default function CreateReportScreen() {
  return (
    <View className="flex-1" style={{ backgroundColor: Colors.screen.tabs }}>
      <AuthCityFooter backgroundColor={Colors.screen.tabs} />

      <CreateReportTopBar />

      <View className="flex-1 px-3 pt-4" style={{ paddingBottom: 160 }}>
        <Text className="mb-4 text-3xl font-extrabold" style={{ color: Colors.text.primary }}>Select an Issue</Text>
        <Text className="mb-4 text-sm" style={{ color: Colors.text.slate }}>Click the selected issue to continue</Text>

        <IssueGrid />
      </View>
    </View>
  );
}
