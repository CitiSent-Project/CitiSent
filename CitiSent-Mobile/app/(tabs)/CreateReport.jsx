import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthCityFooter from "../../components/auth/AuthCityFooter";
import CreateReportTopBar from "../../components/createReport/CreateReportTopBar";
import IssueGrid from "../../components/createReport/IssueGrid";
import { Colors } from "../../constants/colors";

export default function CreateReportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top, backgroundColor: Colors.screen.tabs }}>
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
