export const usersStats = [
  {
    id: 'active-users',
    label: 'Active Users',
    value: '758',
    icon: 'user',
    accent: 'indigo',
  },
  {
    id: 'banned-users',
    label: 'Banned Users',
    value: '5',
    icon: 'user-x',
    accent: 'orange',
  },
]

export const usersFilters = {
  searchPlaceholder: 'Search',
  sortOptions: ['Newest', 'Oldest', 'Name'],
  filterOptions: ['All', 'Verified', 'Unverified', 'Banned'],
  primaryAction: 'Add Users',
}

export const Users = [
  {
    userId: 1001,
    firstName: 'Liam',
    lastName: 'Garcia',
    email: 'liam.garcia@gmail.com',
    phoneNumber: '+63 917 000 1001',
    age: 24,
    gender: 'Male',
    userType: 'Citizen',
    createdAt: '2026-01-03T08:15:00.000Z',
  },
  {
    userId: 1002,
    firstName: 'Emma',
    lastName: 'Reyes',
    email: 'emma.reyes@gmail.com',
    phoneNumber: '+63 917 000 1002',
    age: 29,
    gender: 'Female',
    userType: 'Business',
    createdAt: '2026-01-06T09:30:00.000Z',
  },
  {
    userId: 1003,
    firstName: 'Noah',
    lastName: 'Santos',
    email: 'noah.santos@gmail.com',
    phoneNumber: '+63 917 000 1003',
    age: 33,
    gender: 'Male',
    userType: 'Government',
    createdAt: '2026-01-10T10:10:00.000Z',
  },
  {
    userId: 1004,
    firstName: 'Olivia',
    lastName: 'Navarro',
    email: 'olivia.navarro@gmail.com',
    phoneNumber: '+63 917 000 1004',
    age: 27,
    gender: 'Female',
    userType: 'Citizen',
    createdAt: '2026-01-13T11:45:00.000Z',
  },
  {
    userId: 1005,
    firstName: 'Lucas',
    lastName: 'Flores',
    email: 'lucas.flores@gmail.com',
    phoneNumber: '+63 917 000 1005',
    age: 36,
    gender: 'Male',
    userType: 'Business',
    createdAt: '2026-01-18T07:20:00.000Z',
  },
  {
    userId: 1006,
    firstName: 'Mia',
    lastName: 'Mendoza',
    email: 'mia.mendoza@gmail.com',
    phoneNumber: '+63 917 000 1006',
    age: 22,
    gender: 'Female',
    userType: 'Citizen',
    createdAt: '2026-01-22T13:10:00.000Z',
  },
  {
    userId: 1007,
    firstName: 'Ethan',
    lastName: 'Castillo',
    email: 'ethan.castillo@gmail.com',
    phoneNumber: '+63 917 000 1007',
    age: 41,
    gender: 'Male',
    userType: 'Government',
    createdAt: '2026-01-26T14:40:00.000Z',
  },
  {
    userId: 1008,
    firstName: 'Sophia',
    lastName: 'Ramos',
    email: 'sophia.ramos@gmail.com',
    phoneNumber: '+63 917 000 1008',
    age: 30,
    gender: 'Female',
    userType: 'Business',
    createdAt: '2026-01-29T15:05:00.000Z',
  },
  {
    userId: 1009,
    firstName: 'James',
    lastName: 'Villanueva',
    email: 'james.villanueva@gmail.com',
    phoneNumber: '+63 917 000 1009',
    age: 35,
    gender: 'Male',
    userType: 'Citizen',
    createdAt: '2026-02-02T08:55:00.000Z',
  },
  {
    userId: 1010,
    firstName: 'Amelia',
    lastName: 'Torres',
    email: 'amelia.torres@gmail.com',
    phoneNumber: '+63 917 000 1010',
    age: 28,
    gender: 'Female',
    userType: 'Government',
    createdAt: '2026-02-06T10:35:00.000Z',
  },
  {
    userId: 1011,
    firstName: 'Benjamin',
    lastName: 'Aguilar',
    email: 'benjamin.aguilar@gmail.com',
    phoneNumber: '+63 917 000 1011',
    age: 39,
    gender: 'Male',
    userType: 'Business',
    createdAt: '2026-02-11T12:20:00.000Z',
  },
  {
    userId: 1012,
    firstName: 'Layla',
    lastName: 'Lopez',
    email: 'layla.lopez@gmail.com',
    phoneNumber: '+63 917 000 1012',
    age: 26,
    gender: 'Female',
    userType: 'Citizen',
    createdAt: '2026-02-14T16:10:00.000Z',
  },
]

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  })
}

export function generateNextUserId(existingUsers = []) {
  if (!existingUsers.length) {
    return 'USR-1201'
  }

  const maxId = existingUsers.reduce((max, user) => {
    const numericPart = Number(user.id.replace('USR-', ''))
    return Number.isNaN(numericPart) ? max : Math.max(max, numericPart)
  }, 1200)

  return `USR-${String(maxId + 1)}`
}

export const usersRows = Users.map((user, index) => {
  const createdAtValue = Date.parse(user.createdAt)
  const userName = `${user.firstName} ${user.lastName}`

  return {
    id: `USR-${String(user.userId)}`,
    name: userName,
    email: user.email,
    address: `${user.userType} Services District`,
    status: index % 5 === 0 ? 'Unverified' : 'Verified',
    registeredAt: formatDate(new Date(createdAtValue)),
    registeredAtValue: createdAtValue,
  }
})

export function getLatestRegisteredUsers(users = usersRows, limit = 5) {
  return [...users]
    .sort((a, b) => b.registeredAtValue - a.registeredAtValue)
    .slice(0, limit)
}

export function getLatestJoinedUsersRows(users = usersRows, limit = 5) {
  return getLatestRegisteredUsers(users, limit).map((user) => ({
    username: user.name,
    email: user.email,
    joined: user.registeredAt,
  }))
}
