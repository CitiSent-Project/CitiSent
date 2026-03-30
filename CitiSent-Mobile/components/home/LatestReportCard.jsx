import ReportCard from "../myReports/ReportCard";
import { LATEST_HOME_REPORT } from "../../modules/home/data";
import LatestReportsEmptyState from "./LatestReportsEmptyState";

export default function LatestReportCard({ report = LATEST_HOME_REPORT }) {
  // If report is null, undefined, or has no id/message, show empty state
  if (!report || !report.id || !report.message) {
    return <LatestReportsEmptyState />;
  }
  return <ReportCard report={report} containerClassName="mb-7" />;
}
