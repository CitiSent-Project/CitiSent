import { Text, TextInput, View } from "react-native";
import { Colors } from "../../../modules/shared";

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
      <Text className="mb-2 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onContentSizeChange={onContentSizeChange}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-lg border px-3 py-3 text-base ${multiline ? "min-h-[120px]" : ""}`}
        style={{ borderColor: Colors.border, color: Colors.text.primary, backgroundColor: Colors.background }}
        placeholderTextColor={Colors.icon.muted}
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
        <Text className="mb-2 text-sm font-semibold" style={{ color: Colors.text.fieldLabel }}>Issue Type</Text>
        <View className="rounded-lg border px-3 py-3" style={{ borderColor: Colors.border, backgroundColor: Colors.background }}>
          <Text className="text-base" style={{ color: Colors.text.primary }}>{requestType}</Text>
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
