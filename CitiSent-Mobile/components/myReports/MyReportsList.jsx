import { Text, View } from "react-native";
import MyReportCard from "./reportItem/MyReportCard";
import { Colors } from "../../modules/shared";
import { useNavigation } from "@react-navigation/native";

export default function MyReportsList({ reports }) {
  const navigation = useNavigation();

  if (!reports.length) {
    return (
      <View
        className="rounded-2xl border bg-white px-4 py-8"
        style={{ borderColor: Colors.border }}
      >
        <Text
          className="text-center text-sm font-semibold"
          style={{ color: Colors.text.slate }}
        >
          No reports submitted yet.{" "}
          <Text
            style={{
              color: Colors.primary,
              textDecorationLine: "underline",
            }}
            onPress={() => navigation.navigate("CreateReport")}
          >
            Click here to create a report
          </Text>
        </Text>
      </View>
    );
  }

  return reports.map((report) => (
    <MyReportCard key={report.id} report={report} />
  ));
}