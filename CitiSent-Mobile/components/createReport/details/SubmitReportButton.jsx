import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Colors } from "../../../constants/colors";

export default function SubmitReportButton({ onPress, disabled = false, loading = false }) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      className="mt-2 h-12 items-center justify-center rounded-xl"
      style={{ backgroundColor: isDisabled ? Colors.primarySoft : Colors.ui.headerDark }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.text.inverse} />
      ) : (
        <Text className="text-base font-semibold text-white">Submit Report</Text>
      )}
    </TouchableOpacity>
  );
}
