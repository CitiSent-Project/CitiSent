import { Text, View } from "react-native";
import { Colors } from "../../../modules/shared";

const statusStyles = {
  Completed: {
    backgroundColor: Colors.ui.successSoft,
    textColor: Colors.text.statusComplete,
  },
  "In Progress": {
    backgroundColor: Colors.ui.progressSoft,
    textColor: Colors.text.statusProgress,
  },
  Pending: {
    backgroundColor: Colors.ui.warningSoft,
    textColor: Colors.text.statusPending,
  },
};

export default function ReportStatusBadge({ status }) {
  const style = statusStyles[status] || {
    backgroundColor: Colors.ui.graySoft,
    textColor: Colors.text.slate,
  };

  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: style.backgroundColor }}>
      <Text className="text-[11px] font-bold" style={{ color: style.textColor }}>{status}</Text>
    </View>
  );
}
