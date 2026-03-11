import { Text, View } from "react-native";
import MyReportCard from "./reportItem/MyReportCard";

export default function MyReportsList({ reports }) {
  if (!reports.length) {
    return (
      <View className="rounded-2xl border border-[#E5E7EB] bg-white px-4 py-8">
        <Text className="text-center text-sm font-semibold text-[#4B5563]">No reports submitted yet.</Text>
      </View>
    );
  }

  return reports.map((report) => <MyReportCard key={report.id} report={report} />);
}
