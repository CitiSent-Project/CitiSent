export function buildDashboardStatCards({ statCards = [], iconMap = {} }) {
  return statCards.map((card) => ({
    ...card,
    icon: iconMap[card.iconKey],
  }))
}

export function buildDashboardNewUserRows(rows = []) {
  return rows.map((row) => ({
    username: row.username,
    joined: row.joined,
  }))
}
