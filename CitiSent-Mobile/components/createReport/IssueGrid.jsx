import { View } from "react-native";
import IssueCard from "./IssueCard";

const issues = [
  "Business Permits and Licensing Office (BPLO)",
  "City Treasury Office",
  "Bureau of Fire Protection (BFP) Processing Area",
  "City Traffic Management Division/Impounding Services",
  "City Veterinary Office",
  "City Agriculture Office",
];

export default function IssueGrid() {
  return (
    <View className="flex-row flex-wrap justify-between">
      {issues.map((issue) => (
        <IssueCard key={issue} label={issue} />
      ))}
    </View>
  );
}
