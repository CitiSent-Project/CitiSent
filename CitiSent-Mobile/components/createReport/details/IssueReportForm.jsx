import { Text, TextInput, View } from "react-native";

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  onFocus,
  onLayout,
  onContentSizeChange,
  multiline = false,
  numberOfLines = 1,
}) {
  return (
    <View className="mb-5" onLayout={onLayout}>
      <Text className="mb-2 text-sm font-semibold text-[#374151]">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onContentSizeChange={onContentSizeChange}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-lg border border-[#E5E7EB] bg-white px-3 py-3 text-base text-[#111827] ${multiline ? "min-h-[120px]" : ""}`}
        placeholderTextColor="#9CA3AF"
        scrollEnabled={false}
      />
    </View>
  );
}

export default function IssueReportForm({
  requestType,
  issueLocation,
  report,
  onChangeIssueLocation,
  onChangeReport,
  onInputLayout,
  onInputFocus,
  onReportSizeChange,
}) {
  return (
    <View>
      <View className="mb-5">
        <Text className="mb-2 text-sm font-semibold text-[#374151]">Issue Type</Text>
        <View className="rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-3">
          <Text className="text-base text-[#111827]">{requestType}</Text>
        </View>
      </View>

      <LabeledInput
        label="Issue Location"
        value={issueLocation}
        onChangeText={onChangeIssueLocation}
        onLayout={(event) => onInputLayout?.("issueLocation", event.nativeEvent.layout.y)}
        onFocus={() => onInputFocus?.("issueLocation")}
        placeholder="Enter issue location"
      />

      <LabeledInput
        label="Report"
        value={report}
        onChangeText={onChangeReport}
        onLayout={(event) => onInputLayout?.("report", event.nativeEvent.layout.y)}
        onFocus={() => onInputFocus?.("report")}
        onContentSizeChange={onReportSizeChange}
        placeholder="Describe the issue"
        multiline
        numberOfLines={5}
      />
    </View>
  );
}
