import { Text, View } from "react-native";

const statusStyles = {
  Completed: {
    container: "bg-[#E9F8EF]",
    text: "text-[#2C8A5A]",
  },
  "In Progress": {
    container: "bg-[#EAF4FF]",
    text: "text-[#2D6FA9]",
  },
  Pending: {
    container: "bg-[#FFF5E8]",
    text: "text-[#B86A08]",
  },
};

export default function ReportStatusBadge({ status }) {
  const style = statusStyles[status] || {
    container: "bg-[#F3F4F6]",
    text: "text-[#4B5563]",
  };

  return (
    <View className={`rounded-full px-2.5 py-1 ${style.container}`}>
      <Text className={`text-[11px] font-bold ${style.text}`}>{status}</Text>
    </View>
  );
}
