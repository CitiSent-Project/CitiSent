export const MY_REPORTS = [
  {
    id: "report-1",
    issueType: "Streetlight Maintenance",
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
    issueType: "Illegal Garbage Dumping",
    location: "Riverside Path, Brgy. San Jose",
    description:
      "Multiple trash bags are being left near the drainage canal every morning, creating foul odor and attracting stray animals.",
    createdAt: "2026-03-05T08:09:00+08:00",
    status: "In Progress",
    attachment: null,
  },
  {
    id: "report-3",
    issueType: "Pothole Repair",
    location: "Riverside Path, Brgy. San Jose",
    description:
      "A large pothole has formed near the intersection of Main Street and 2nd Avenue, causing traffic congestion and posing a hazard to motorists.",
    createdAt: "2026-02-28T14:30:00+08:00",
    status: "Pending",
    attachment: null,
  },
];
