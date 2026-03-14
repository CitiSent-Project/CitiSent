import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function EditReportSheet({ visible, report, onClose, onSave }) {
  const [issueType, setIssueType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!report) {
      return;
    }

    setIssueType(report.issueType || "");
    setLocation(report.location || "");
    setDescription(report.description || "");
    setErrorMessage("");
  }, [report]);

  const canSave = useMemo(() => {
    return issueType.trim().length > 0 && location.trim().length > 0 && description.trim().length > 0;
  }, [description, issueType, location]);

  const handleSave = () => {
    if (!canSave) {
      setErrorMessage("Please fill in issue type, location, and description.");
      return;
    }

    onSave?.({
      issueType: issueType.trim(),
      location: location.trim(),
      description: description.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[86%] rounded-t-3xl bg-white px-4 pb-6 pt-4">
          <View className="mb-3 items-center">
            <View className="h-1.5 w-14 rounded-full bg-[#CBD5E1]" />
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-[#0F172A]">Edit report</Text>
            <Pressable onPress={onClose} className="rounded-lg bg-[#EEF2F7] px-3 py-2">
              <Text className="text-xs font-bold text-[#334155]">Close</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">Issue Type</Text>
            <TextInput
              value={issueType}
              onChangeText={setIssueType}
              placeholder="Issue type"
              className="mb-3 rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm text-[#0F172A]"
              placeholderTextColor="#94A3B8"
            />

            <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Issue location"
              className="mb-3 rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm text-[#0F172A]"
              placeholderTextColor="#94A3B8"
            />

            <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-[#64748B]">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue"
              multiline
              textAlignVertical="top"
              className="mb-3 min-h-[110px] rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm text-[#0F172A]"
              placeholderTextColor="#94A3B8"
            />

            {errorMessage ? <Text className="mt-2 text-xs font-semibold text-[#B91C1C]">{errorMessage}</Text> : null}
          </ScrollView>

          <Pressable
            onPress={handleSave}
            className={`mt-4 rounded-xl px-4 py-3 ${canSave ? "bg-[#1D4ED8]" : "bg-[#93C5FD]"}`}
          >
            <Text className="text-center text-sm font-bold text-white">Save Changes</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
