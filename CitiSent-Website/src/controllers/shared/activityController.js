import { createActivityEntry } from '../models/data'

export function buildNextActivityLog({ previousActivityLog, action, detail, maxItems = 25 }) {
  return [createActivityEntry(action, detail), ...previousActivityLog].slice(0, maxItems)
}
