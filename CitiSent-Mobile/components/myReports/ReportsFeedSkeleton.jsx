import { View } from "react-native";
import SkeletonBlock from "../ui/SkeletonBlock";
import { Colors } from "../../modules/shared";

function ReportCardSkeleton() {
  return (
    <View className="mb-4 rounded-2xl border bg-white px-4 py-4" style={{ borderColor: Colors.borderCard }}>
      <View className="mb-3 flex-row items-center justify-between">
        <SkeletonBlock className="h-3 w-24 rounded-full" />
        <SkeletonBlock className="h-3 w-16 rounded-full" />
      </View>
      <SkeletonBlock className="mb-2 h-3 w-full rounded-full" />
      <SkeletonBlock className="mb-2 h-3 w-11/12 rounded-full" />
      <SkeletonBlock className="mb-4 h-3 w-8/12 rounded-full" />
      <SkeletonBlock className="h-3 w-20 rounded-full" />
    </View>
  );
}

export default function ReportsFeedSkeleton() {
  return (
    <View>
      <SkeletonBlock className="mb-4 h-5 w-36 rounded-full" />
      <ReportCardSkeleton />

      <ReportCardSkeleton />
      <ReportCardSkeleton />
      <ReportCardSkeleton />
    </View>
  );
}
