import { Text } from "react-native";
import { Colors } from "../../modules/shared";

export default function SectionTitle({ title }) {
  return <Text className="mb-3 text-3xl font-extrabold" style={{ color: Colors.text.primary }}>{title}</Text>;
}
