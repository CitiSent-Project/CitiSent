import { View } from "react-native";

export default function Card({ children, className = "" }) {
  return (
    <View className={`bg-white rounded-2xl shadow p-4 ${className}`}>
      {children}
    </View>
  );
}
