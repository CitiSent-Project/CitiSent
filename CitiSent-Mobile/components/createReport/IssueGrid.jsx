import { useRouter } from "expo-router";
import { View } from "react-native";
import IssueCard from "./IssueCard";

export default function IssueGrid({ issues = [] }) {
  const router = useRouter();
  const issueOptions = Array.isArray(issues) ? issues : [];
  
  const remainder = issueOptions.length % 3;
  const emptyPlaceholders = remainder === 0 ? 0 : 3 - remainder;

  return (
    <View className="flex-row flex-wrap justify-between">
      {issueOptions.map((issue) => (
        <IssueCard
          key={issue.id}
          label={issue.label}
          logoSource={issue.logoSource}
          onPress={() =>
            router.push({
              pathname: "/create-report/[issueId]",
              params: { issueId: issue.id },
            })
          }
        />
      ))}
      {Array.from({ length: emptyPlaceholders }).map((_, i) => (
        <View key={`placeholder-${i}`} className="basis-[31.5%]" />
      ))}
    </View>
  );
}
