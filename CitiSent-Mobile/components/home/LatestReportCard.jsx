import ReportCard from "../myReports/ReportCard";

const latestSampleReport = {
  id: "latest-home-1",
  name: "Juan dela cruz",
  time: "19mins ago",
  tags: ["Emergency"],
  message: "HELP!!! The system deleted all my files and I need them NOW!!! Please fix this immediately!!",
  location: "Sto Tomas",
};

export default function LatestReportCard() {
  return <ReportCard report={latestSampleReport} containerClassName="mb-7" />;
}
