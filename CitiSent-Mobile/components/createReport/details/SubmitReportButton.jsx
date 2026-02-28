import { ActivityIndicator, Text, TouchableOpacity } from "react-native";

export default function SubmitReportButton({ onPress, disabled = false, loading = false }) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      className={`mt-2 h-12 items-center justify-center rounded-xl ${isDisabled ? "bg-[#93C5FD]" : "bg-[#223D68]"}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text className="text-base font-semibold text-white">Submit Report</Text>
      )}
    </TouchableOpacity>
  );
}
