import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function CallScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-6">
        <Text className="text-2xl font-bold text-gray-900">Emergency Call</Text>
        <Text className="text-base text-gray-500 text-center px-8">
          Tap the button below to contact emergency services
        </Text>
        <TouchableOpacity style={styles.callButton} activeOpacity={0.8}>
          <Ionicons name="call" size={42} color="white" />
        </TouchableOpacity>
        <Text className="text-sm text-red-500 font-semibold">
          EMERGENCY HOTLINE
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  callButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2D57A0",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2D57A0",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
});
