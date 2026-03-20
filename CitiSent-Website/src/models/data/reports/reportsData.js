export const reportsSummaryStats = [
  {
    id: 'total-reports',
    label: 'Total Reports',
    value: '758',
    icon: 'folder',
    accent: 'green',
  },
  {
    id: 'resolved-reports',
    label: 'Reports Resolved',
    value: '650',
    icon: 'resolved',
    accent: 'amber',
  },
  {
    id: 'unresolved-reports',
    label: 'Unresolved Reports',
    value: '108',
    icon: 'unresolved',
    accent: 'violet',
  },
]

export const reportsByCategoryData = {
  title: 'Total Reports Per Category',
  total: '0',
  labels: [
    'BPLO',
    'City Agriculture Office',
    'City Cooperative Development Office',
    'BFP Processing Area',
    'City Veterinary Office',
    'City Traffic Management Division',
    'PESO',
    'Senior Citizens / PWD Accessibility Services',
  ],
  values: [72, 54, 38, 45, 26, 21, 48, 42],
  colors: ['#1650e8', '#65c98d', '#8d66d6', '#ff9082', '#39bee0', '#ffb44d', '#2f89e5', '#7a6ce5'],
  legend: [
    { label: 'BPLO', color: '#1650e8' },
    { label: 'City Agriculture Office', color: '#65c98d' },
    { label: 'City Cooperative Development Office', color: '#8d66d6' },
    { label: 'BFP Processing Area', color: '#ff9082' },
    { label: 'City Veterinary Office', color: '#39bee0' },
    { label: 'City Traffic Management Division', color: '#ffb44d' },
    { label: 'PESO', color: '#2f89e5' },
    { label: 'Senior Citizens / PWD Accessibility Services', color: '#7a6ce5' },
  ],
}

export const reportsThisWeekData = {
  title: 'Total Reports This Week',
  labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  values: [180, 60, 400, 130, 490, 190, 80],
}

export const categoryAgencyCards = [
  { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)' },
  { id: 'cto', label: 'City Treasury Office' },
  { id: 'bfp', label: 'Bureau of Fire Protection (BFP) Processing Area' },
  { id: 'ctmd', label: 'City Traffic Management Division/Impounding Services' },
  { id: 'cvo', label: 'City Veterinary Office' },
  { id: 'cao', label: 'City Agriculture Office' },
  { id: 'ccdo', label: 'City Cooperative Development Office' },
  { id: 'peso', label: 'Public Employment Service Office (PESO)' },
  { id: 'pwd', label: 'Senior Citizens / PWD Accessibility Services' },
]

export const allCategoryFilterId = 'all-categories'

export const urgencyLevelsData = {
  title: 'Reports By Urgency Levels',
  total: '0',
  labels: ['Emergency', 'Urgent', 'Moderate', 'Calm'],
  values: [18, 21, 54, 93],
  colors: ['#1e3a8a', '#1d4ed8', '#3b82f6', '#93c5fd'],
  legend: [
    { label: 'Emergency', color: '#1e3a8a' },
    { label: 'Urgent', color: '#1d4ed8' },
    { label: 'Moderate', color: '#3b82f6' },
    { label: 'Calm', color: '#93c5fd' },
  ],
}

export const urgencyFilterChips = ['All Reports', 'Emergency', 'Urgent', 'Moderate', 'Calm']

const urgencyTypes = urgencyFilterChips.filter((chip) => chip !== 'All Reports')

export const UserReports = [
  {
    reportNum: 201,
    userId: 1001,
    reportDescription: 'A road section in Poblacion East has deep potholes that are causing traffic slowdown.',
    reportCategory: 'ctmd',
    urgencyType: 'Urgent',
    reportLocation: 'Poblacion East, Sto. Tomas Batangas',
    source: 'Mobile App',
    createdAt: '2026-03-01T08:20:00.000Z',
    status: 'Pending',
  },
  {
    reportNum: 202,
    userId: 1002,
    reportDescription: 'Business permit renewal queue is delayed due to missing transaction receipt synchronization.',
    reportCategory: 'bplo',
    urgencyType: 'Moderate',
    reportLocation: 'City Hall Annex, BPLO Wing',
    source: 'Website',
    createdAt: '2026-03-01T09:10:00.000Z',
    status: 'In Progress',
  },
  {
    reportNum: 203,
    userId: 1003,
    reportDescription: 'Citizen requested confirmation for tax payment posting after online transfer.',
    reportCategory: 'cto',
    urgencyType: 'Calm',
    reportLocation: 'City Treasury Office',
    source: 'Helpdesk',
    createdAt: '2026-03-02T07:40:00.000Z',
    status: 'Resolved',
  },
  {
    reportNum: 204,
    userId: 1004,
    reportDescription: 'Smoke and suspected electrical fire were reported near the market storage area.',
    reportCategory: 'bfp',
    urgencyType: 'Emergency',
    reportLocation: 'Public Market Storage Area',
    source: 'Walk-in Desk',
    createdAt: '2026-03-02T10:05:00.000Z',
    status: 'Pending',
  },
  {
    reportNum: 205,
    userId: 1005,
    reportDescription: 'Delayed release of veterinary inspection clearance for meat transport permit.',
    reportCategory: 'cvo',
    urgencyType: 'Urgent',
    reportLocation: 'City Veterinary Office',
    source: 'Website',
    createdAt: '2026-03-03T11:35:00.000Z',
    status: 'In Progress',
  },
  {
    reportNum: 206,
    userId: 1006,
    reportDescription: 'The employment portal shows inconsistent vacancy counts for PESO postings.',
    reportCategory: 'peso',
    urgencyType: 'Moderate',
    reportLocation: 'Public Employment Service Office',
    source: 'Mobile App',
    createdAt: '2026-03-03T15:20:00.000Z',
    status: 'Pending',
  },
  {
    reportNum: 207,
    userId: 1007,
    reportDescription: 'Multiple traffic signals stopped working near the junction causing congestion.',
    reportCategory: 'ctmd',
    urgencyType: 'Emergency',
    reportLocation: 'National Highway Junction',
    source: 'Helpdesk',
    createdAt: '2026-03-04T08:45:00.000Z',
    status: 'In Progress',
  },
  {
    reportNum: 208,
    userId: 1008,
    reportDescription: 'PWD accessibility ramp in the cooperative office requires immediate repair.',
    reportCategory: 'pwd',
    urgencyType: 'Urgent',
    reportLocation: 'City Cooperative Office Entrance',
    source: 'Website',
    createdAt: '2026-03-04T13:15:00.000Z',
    status: 'Pending',
  },
  {
    reportNum: 209,
    userId: 1009,
    reportDescription: 'City agriculture support request follow-up for delayed seed distribution schedule.',
    reportCategory: 'cao',
    urgencyType: 'Calm',
    reportLocation: 'City Agriculture Office',
    source: 'Mobile App',
    createdAt: '2026-03-05T09:05:00.000Z',
    status: 'Resolved',
  },
  {
    reportNum: 210,
    userId: 1010,
    reportDescription: 'Citizens reported unusually long processing time for cooperative registration documents.',
    reportCategory: 'ccdo',
    urgencyType: 'Moderate',
    reportLocation: 'City Cooperative Development Office',
    source: 'Walk-in Desk',
    createdAt: '2026-03-05T16:25:00.000Z',
    status: 'Pending',
  },
  {
    reportNum: 211,
    userId: 1011,
    reportDescription: 'Permit-related complaint escalated due to repeated document upload failures.',
    reportCategory: 'bplo',
    urgencyType: 'Urgent',
    reportLocation: 'Online Permit Portal',
    source: 'Website',
    createdAt: '2026-03-06T10:50:00.000Z',
    status: 'In Progress',
  },
  {
    reportNum: 212,
    userId: 1012,
    reportDescription: 'Request for updated office hours and payment channels in treasury office.',
    reportCategory: 'cto',
    urgencyType: 'Calm',
    reportLocation: 'City Treasury Office',
    source: 'Mobile App',
    createdAt: '2026-03-06T14:40:00.000Z',
    status: 'Resolved',
  },
]

const categoryCountById = categoryAgencyCards.reduce((accumulator, agency) => {
  accumulator[agency.id] = UserReports.filter((row) => row.reportCategory === agency.id).length
  return accumulator
}, {})

reportsByCategoryData.values = categoryAgencyCards.map((agency) => categoryCountById[agency.id] || 0)
reportsByCategoryData.total = String(UserReports.length)

const urgencyCounts = urgencyTypes.map((type) =>
  UserReports.filter((row) => row.urgencyType === type).length
)

urgencyLevelsData.values = urgencyCounts
urgencyLevelsData.total = String(UserReports.length)
