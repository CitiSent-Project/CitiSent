import { useRouter } from "expo-router";
import { View } from "react-native";
import IssueCard from "./IssueCard";

export default function IssueGrid({ issues = [] }) {
  const router = useRouter();
  const issueOptions = Array.isArray(issues) ? issues : [];

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
    </View>
  );
}
