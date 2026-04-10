import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Colors } from "../../../modules/shared";

export default function EditReportSheet({ visible, report, onClose, onSave }) {
  const [issueType, setIssueType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!report) {
      return;
    }

    setIssueType(report.issueType || "");
    setLocation(report.location || "");
    setDescription(report.description || "");
    setErrorMessage("");
    setIsSaving(false);
  }, [report]);

  const canSave = useMemo(() => {
    if (!report) return false;

    const hasChanges =
      issueType.trim() !== (report.issueType || "").trim() ||
      location.trim() !== (report.location || "").trim() ||
      description.trim() !== (report.description || "").trim();

    const isFilled = issueType.trim().length > 0 && location.trim().length > 0 && description.trim().length > 0;

    return isFilled && hasChanges;
  }, [description, issueType, location, report]);

  const handleSave = async () => {
    if (!canSave || isSaving) {
      const isFilled = issueType.trim().length > 0 && location.trim().length > 0 && description.trim().length > 0;
      if (!isFilled && !isSaving) {
        setErrorMessage("Please fill in location, and description.");
      } else if (!isSaving) {
        setErrorMessage("No changes made to the report.");
      }
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      await onSave?.({
        issueType: issueType.trim(),
        location: location.trim(),
        description: description.trim(),
      });
    } catch (e) {
      setErrorMessage("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[86%] rounded-t-3xl bg-white px-4 pb-6 pt-4">
          <View className="mb-3 items-center">
            <View className="h-1.5 w-14 rounded-full" style={{ backgroundColor: Colors.ui.neutralSoft }} />
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-extrabold" style={{ color: Colors.text.heading }}>Edit report</Text>
            <Pressable onPress={onClose} className="rounded-lg px-3 py-2" style={{ backgroundColor: Colors.ui.neutralMuted }}>
              <Text className="text-xs font-bold" style={{ color: Colors.text.body }}>Close</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            <Text className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>Location</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Issue location"
              className="mb-3 rounded-xl border bg-white px-3 py-3 text-sm"
              style={{ borderColor: Colors.borderMuted, color: Colors.text.heading }}
              placeholderTextColor={Colors.icon.muted}
            />

            <Text className="mb-1 text-xs font-bold uppercase tracking-wide" style={{ color: Colors.text.secondary }}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the issue"
              multiline
              textAlignVertical="top"
              className="mb-3 min-h-[110px] rounded-xl border bg-white px-3 py-3 text-sm"
              style={{ borderColor: Colors.borderMuted, color: Colors.text.heading }}
              placeholderTextColor={Colors.icon.muted}
            />

            {errorMessage ? <Text className="mt-2 text-xs font-semibold" style={{ color: Colors.text.danger }}>{errorMessage}</Text> : null}
          </ScrollView>

          <Pressable
            onPress={handleSave}
            disabled={!canSave || isSaving}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3"
            style={{ backgroundColor: canSave && !isSaving ? Colors.primaryStrong : Colors.primarySoft }}
          >
            {isSaving && <ActivityIndicator color="#fff" size="small" />}
            <Text className="text-center text-sm font-bold text-white">
              {isSaving ? "Saving..." : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
