import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthCityFooter from "../../components/auth/AuthCityFooter";
import CreateReportTopBar from "../../components/createReport/CreateReportTopBar";
import IssueGrid from "../../components/createReport/IssueGrid";

export default function CreateReportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <CreateReportTopBar />

      <View className="flex-1 px-3 pt-4" style={{ paddingBottom: 160 }}>
        <Text className="mb-4 text-3xl font-extrabold text-[#111827]">Select an Issue</Text>
        <Text className="mb-4 text-sm text-[#4B5563]">Click the selected issue to continue</Text>

        <IssueGrid />
      </View>

      <AuthCityFooter />
    </View>
  );
}
