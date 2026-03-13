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

const firstNames = [
	'Liam',
	'Noah',
	'Emma',
	'Olivia',
	'Ava',
	'Lucas',
	'Mia',
	'Elijah',
	'Sophia',
	'Isabella',
	'Ethan',
	'Charlotte',
	'James',
	'Harper',
	'Benjamin',
	'Amelia',
	'Leo',
	'Chloe',
	'Mateo',
	'Layla',
]

const lastNames = [
	'Garcia',
	'Reyes',
	'Santos',
	'Dela Cruz',
	'Navarro',
	'Flores',
	'Mendoza',
	'Castillo',
	'Ramos',
	'Villanueva',
	'Torres',
	'Aguilar',
	'Lopez',
	'Rivera',
	'Bautista',
]

const addressPool = [
	'San Isidro Norte',
	'San Isidro Sur',
	'Poblacion East',
	'Poblacion West',
	'Maple Heights',
	'Riverside',
	'Hillside',
	'Sta. Lucia',
	'Green Meadows',
	'Villa Aurora',
]

const statusPool = ['Verified', 'Unverified']

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomItem(items) {
	return items[randomInt(0, items.length - 1)]
}

function formatDate(date) {
	return date.toLocaleDateString('en-US', {
		month: 'long',
		day: '2-digit',
		year: 'numeric',
	})
}

function buildEmail(name) {
	return `${name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
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

export function createRandomUser(existingUsers = []) {
	const firstName = randomItem(firstNames)
	const lastName = randomItem(lastNames)
	const name = `${firstName} ${lastName}`
	const daysAgo = randomInt(0, 120)
	const createdAt = Date.now() - daysAgo * 24 * 60 * 60 * 1000
	const createdDate = new Date(createdAt)

	return {
		id: generateNextUserId(existingUsers),
		name,
		email: buildEmail(name),
		address: randomItem(addressPool),
		status: randomItem(statusPool),
		registeredAt: formatDate(createdDate),
		registeredAtValue: createdAt,
	}
}

export const usersRows = Array.from({ length: 48 }, (_, index) => {
	const seedUser = createRandomUser([])
	const createdAt = Date.now() - (index + 1) * randomInt(1, 3) * 24 * 60 * 60 * 1000
	const createdDate = new Date(createdAt)

	return {
		...seedUser,
		id: `USR-${String(1201 + index)}`,
		registeredAt: formatDate(createdDate),
		registeredAtValue: createdAt,
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
