import { Text, TouchableOpacity } from "react-native";

export default function Button({ title, onPress, variant = "primary" }) {
  const base = "py-3 px-6 rounded-xl items-center justify-center";
  const variants = {
    primary: "bg-blue-500",
    secondary: "bg-gray-200",
    outline: "border border-blue-500 bg-transparent",
  };

  const textVariants = {
    primary: "text-white font-semibold",
    secondary: "text-gray-800 font-semibold",
    outline: "text-blue-500 font-semibold",
  };

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]}`}
      onPress={onPress}
    >
      <Text className={textVariants[variant]}>{title}</Text>
    </TouchableOpacity>
  );
}
