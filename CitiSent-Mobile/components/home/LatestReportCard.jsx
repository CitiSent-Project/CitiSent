import ReportCard from "../myReports/ReportCard";
import { LATEST_HOME_REPORT } from "../../modules/home/data";

export default function LatestReportCard({ report = LATEST_HOME_REPORT }) {
  return <ReportCard report={report} containerClassName="mb-7" />;
}
