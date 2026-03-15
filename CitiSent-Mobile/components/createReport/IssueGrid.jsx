import { useRouter } from "expo-router";
import { View } from "react-native";
import IssueCard from "./IssueCard";
import { CREATE_REPORT_ISSUES } from "../../modules/createReport/data";

export default function IssueGrid() {
  const router = useRouter();

  return (
    <View className="flex-row flex-wrap justify-between">
      {CREATE_REPORT_ISSUES.map((issue) => (
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
