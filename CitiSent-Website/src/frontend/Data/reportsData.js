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
  total: '346.03',
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
  { id: 'bplo', label: 'Business Permits and Licensing Office (BPLO)'},
  { id: 'cto', label: 'City Treasury Office'},
  { id: 'bfp', label: 'Bureau of Fire Protection (BFP) Processing Area'},
  { id: 'ctmd', label: 'City Traffic Management Division/Impounding Services'},
  { id: 'cvo', label: 'City Veterinary Office'},
  { id: 'cao', label: 'City Agriculture Office'},
  { id: 'ccdo', label: 'City Cooperative Development Office' },
  { id: 'peso', label: 'Public Employment Service Office (PESO)' },
  { id: 'pwd', label: 'Senior Citizens / PWD Accessibility Services' },
]

export const allCategoryFilterId = 'all-categories'

export const urgencyLevelsData = {
  title: 'Reports By Urgency Levels',
  total: '186',
  labels: ['Emergency', 'Urgent', 'Moderate', 'Low Priority', 'Calm'],
  values: [18, 21, 54, 63, 30],
  colors: ['#ff4f5e', '#f3ad68', '#d6ea65', '#43cf52', '#75a7d8'],
  legend: [
    { label: 'Emergency', color: '#ff4f5e' },
    { label: 'Urgent', color: '#f3ad68' },
    { label: 'Moderate', color: '#d6ea65' },
    { label: 'Low Priority', color: '#43cf52' },
    { label: 'Calm', color: '#75a7d8' },
  ],
}

export const urgencyFilterChips = ['All Reports', 'Emergency', 'Urgent', 'Moderate', 'Low Priority', 'Calm']

const urgencyTypes = urgencyFilterChips.filter((chip) => chip !== 'All Reports')

const firstNames = [
  'John',
  'Maria',
  'Paulo',
  'Jasmine',
  'Ethan',
  'Lara',
  'Noel',
  'Sophia',
  'Miguel',
  'Raine',
]

const lastNames = ['Madriaga', 'Reyes', 'Santos', 'Lopez', 'Garcia', 'Navarro', 'Flores', 'Castillo']

const barangays = [
  'San Rafael',
  'San Isidro Norte',
  'Poblacion East',
  'Poblacion West',
  'Sta. Lucia',
  'Riverside',
  'Villa Aurora',
]

const categories = categoryAgencyCards.map((agency) => ({
  id: agency.id,
  label: agency.label,
}))

const sources = ['Mobile App', 'Website', 'Helpdesk', 'Walk-in Desk']

const reportMessages = {
  Emergency: [
    'There is an urgent fire hazard concern in our area that needs immediate attention.',
    'A serious road accident was reported and responders are needed right away.',
  ],
  Urgent: [
    'My permit request is blocking operations and needs immediate follow-up.',
    'Streetlights in our block are down and safety is becoming a concern.',
  ],
  Moderate: [
    'I am following up on an unresolved account verification request.',
    'The online form is intermittently failing when uploading documents.',
  ],
  'Low Priority': [
    'The dashboard loads slower than expected on older devices.',
    'Some labels in the app look misaligned on my screen.',
  ],
  Calm: [
    'Can you share updated office hours for this weekend?',
    'I would like to ask where to check current permit status.',
  ],
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem(items) {
  return items[randomInt(0, items.length - 1)]
}

function randomDateWithinDays(days) {
  const daysAgo = randomInt(0, days)
  const value = Date.now() - daysAgo * 24 * 60 * 60 * 1000

  return {
    date: new Date(value).toLocaleDateString('en-US', {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    }),
    value,
  }
}

function createUrgencyReportRow(index) {
  const first = randomItem(firstNames)
  const last = randomItem(lastNames)
  const urgency = randomItem(urgencyTypes)
  const selectedCategory = randomItem(categories)
  const dateInfo = randomDateWithinDays(40)
  const name = `${first} ${last}`

  return {
    id: `UR-${String(201 + index)}`,
    name,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`,
    location: `${randomItem(barangays)}, Sto. Tomas Batangas`,
    date: dateInfo.date,
    dateValue: dateInfo.value,
    categoryId: selectedCategory.id,
    category: selectedCategory.label,
    source: randomItem(sources),
    message: randomItem(reportMessages[urgency]),
    urgency,
  }
}

export const urgencyFeedRows = Array.from({ length: 36 }, (_, index) => createUrgencyReportRow(index))

const urgencyCounts = urgencyTypes.map((type) =>
  urgencyFeedRows.filter((row) => row.urgency === type).length
)

urgencyLevelsData.values = urgencyCounts
urgencyLevelsData.total = String(urgencyFeedRows.length)
