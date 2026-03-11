import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MyReportsList from "../../components/myReports/MyReportsList";
import SectionTitle from "../../components/myReports/SectionTitle";
import { MY_REPORTS } from "../../constants/myReportsData";
import MyReportsTopBar from "../../components/myReports/MyReportsTopBar";

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#ECECEC]" style={{ paddingTop: insets.top }}>
      <MyReportsTopBar />

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        <SectionTitle title="My Submitted Reports" />
        <Text className="mb-3 text-sm text-[#64748B]">
          Track the status and details of every concern you have submitted.
        </Text>

        <MyReportsList reports={MY_REPORTS} />
      </ScrollView>
    </View>
  );
}
