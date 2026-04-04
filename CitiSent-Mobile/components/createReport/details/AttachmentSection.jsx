import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../../modules/shared";

export default function AttachmentSection({ imageUri, onImageSelect }) {
  const handleSelectImage = async () => {
    Alert.alert(
      "Attach a photo",
      "Choose an option",
      [
        {
          text: "Camera",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Permission required",
                "Sorry, we need camera permissions to make this work!",
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });
            if (!result.canceled) {
              onImageSelect(result.assets[0].uri);
            }
          },
        },
        {
          text: "Gallery",
          onPress: async () => {
            const { status } =
              await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
              Alert.alert(
                "Permission required",
                "Sorry, we need gallery permissions to make this work!",
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              quality: 0.8,
            });
            if (!result.canceled) {
              onImageSelect(result.assets[0].uri);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View className="mb-5">
      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Attach a photo of the issue"
        className="h-44 items-center justify-center rounded-xl overflow-hidden"
        style={{ backgroundColor: Colors.ui.graySoft }}
        onPress={handleSelectImage}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <>
            <Ionicons
              name="camera-outline"
              size={64}
              color={Colors.icon.muted}
            />
            <Text
              className="mt-2 text-xs"
              style={{ color: Colors.text.secondary }}
            >
              Attach a photo of the issue (optional)
            </Text>
          </>
        )}
      </TouchableOpacity>
      {imageUri && (
        <TouchableOpacity
          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
          onPress={() => onImageSelect(null)}
        >
          <Ionicons name="close-circle" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}
