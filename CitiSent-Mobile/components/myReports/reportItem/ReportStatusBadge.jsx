import { Text, View } from "react-native";
import { Colors } from "../../../constants/colors";

const statusStyles = {
  Completed: {
    backgroundColor: Colors.ui.successSoft,
    text: "text-[#2C8A5A]",
  },
  "In Progress": {
    backgroundColor: Colors.ui.progressSoft,
    text: "text-[#2D6FA9]",
  },
  Pending: {
    backgroundColor: Colors.ui.warningSoft,
    text: "text-[#B86A08]",
  },
};

export default function ReportStatusBadge({ status }) {
  const style = statusStyles[status] || {
    backgroundColor: Colors.ui.graySoft,
    text: "text-[#4B5563]",
  };

  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: style.backgroundColor }}>
      <Text className={`text-[11px] font-bold ${style.text}`}>{status}</Text>
    </View>
  );
}
