export const MY_REPORTS = [
  {
    id: "report-1",
    issueType: "City Traffic Management Division/Impounding Services",
    location: "Purok 3, Sto Tomas",
    description:
      "A streetlight in front of the barangay hall has been flickering for several nights and turns off completely after midnight.",
    createdAt: "2026-03-09T21:15:00+08:00",
    status: "Completed",
    attachment: {
      kind: "image",
      source: require("../assets/samplePics/streetlight.jpg"),
    },
  },
  {
    id: "report-2",
    issueType: "City Treasury Office",
    location: "Riverside Path, Brgy. San Jose",
    description:
      "The processing area at the City Treasury Office is crowded with taxpayers paying business permits and local taxes. The queue is long, causing delays in payment processing and long waiting times for applicants.",
    createdAt: "2026-03-05T08:09:00+08:00",
    status: "In Progress",
    attachment: null,
  },
  {
    id: "report-3",
    issueType: "Bureau of Fire Protection (BFP) Processing Area",
    location: "Riverside Path, Brgy. San Jose",
    description:
      "The BFP processing area is overcrowded with many applicants waiting for Fire Safety Inspection Certificate processing. The queue is long and the waiting time is taking more than an hour due to limited staff at the counter.",
    createdAt: "2026-02-28T14:30:00+08:00",
    status: "Pending",
    attachment: null,
  },
];
