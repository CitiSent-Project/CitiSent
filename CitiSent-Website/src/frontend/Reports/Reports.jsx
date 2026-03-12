import { ByCategory } from './ByCategory'
import { ByUrgencyLevels } from './ByUrgencyLevels'

export function Reports({ section = 'category' }) {
  if (section === 'urgency') {
    return <ByUrgencyLevels />
  }

  return <ByCategory />
}