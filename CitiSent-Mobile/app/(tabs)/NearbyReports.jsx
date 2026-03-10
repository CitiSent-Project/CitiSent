import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PriorityChips from "../../components/myReports/PriorityChips";
import ReportCard from "../../components/myReports/ReportCard";
import ReportsFeedSkeleton from "../../components/myReports/ReportsFeedSkeleton";
import SectionTitle from "../../components/myReports/SectionTitle";
import PageTopBar from "../../components/layout/PageTopBar";

const latestNearbyReports = [
  {
    id: "latest-1",
    name: "Anonymous",
    time: "19mins ago",
    tags: ["Emergency"],
    message: "HELP!!! The system deleted all my files and I need them NOW!!! Please fix this immediately!!!",
    location: "Sto Tomas",
  },
];

const otherNearbyReports = [
  {
    id: "other-1",
    name: "Anonymous",
    time: "19mins ago",
    priority: "emergency",
    tags: ["Emergency"],
    message: "HELP!!! The system deleted all my files and I need them NOW!!! Please fix this immediately!!!",
    location: "Sto Tomas",
  },
  {
    id: "other-2",
    name: "Anonymous",
    time: "12mins ago",
    priority: "urgent",
    tags: ["Urgent"],
    message: "The road shoulder is collapsing near the crossing. Please send help quickly.",
    location: "Sto Tomas",
  },
  {
    id: "other-3",
    name: "Anonymous",
    time: "8mins ago",
    priority: "moderate",
    tags: ["Moderate"],
    message: "Streetlight is flickering every night and may need replacement soon.",
    location: "Poblacion",
  },
  {
    id: "other-4",
    name: "Anonymous",
    time: "5mins ago",
    priority: "low",
    tags: ["Low priority"],
    message: "Small pothole near the sidewalk. Not urgent but needs repair.",
    location: "Sto Tomas",
  },
];

export default function NearbyReportsScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState("all");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timeout);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setSelectedPriority("all");
    }, [])
  );

  const filteredOtherReports = useMemo(() => {
    if (selectedPriority === "all") {
      return otherNearbyReports;
    }

    return otherNearbyReports.filter((report) => report.priority === selectedPriority);
  }, [selectedPriority]);

  return (
    <View className="flex-1 bg-[#ECECEC]" style={{ paddingTop: insets.top }}>
      <PageTopBar title="All Reports" />
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ReportsFeedSkeleton />
        ) : (
          <>
            <SectionTitle title="Latest Reports" />
            {latestNearbyReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}

            <SectionTitle title="Other Reports" />
            <PriorityChips selectedPriority={selectedPriority} onSelectPriority={setSelectedPriority} />

            {filteredOtherReports.length > 0 ? (
              filteredOtherReports.map((report) => <ReportCard key={report.id} report={report} />)
            ) : (
              <View className="mb-4 rounded-2xl border border-[#E2E2E2] bg-white px-4 py-5">
                <Text className="text-center text-sm font-semibold text-[#4B5563]">
                  No reports found for this priority.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
