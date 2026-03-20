import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadFromStorage,
  loadFromStorageWithSchema,
  saveToStorage,
  saveToStorageWithSchema,
} from '../storageService'

function createMockStorage() {
  const store = new Map()

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null
    },
    setItem(key, value) {
      store.set(key, String(value))
    },
    clear() {
      store.clear()
    },
  }
}

describe('storageService schema support', () => {
  beforeEach(() => {
    globalThis.window = {
      localStorage: createMockStorage(),
    }
    window.localStorage.clear()
  })

  it('reads and writes plain values', () => {
    saveToStorage('test.key', { enabled: true })

    expect(loadFromStorage('test.key', null)).toEqual({ enabled: true })
  })

  it('writes values in schema envelope', () => {
    saveToStorageWithSchema('test.schema', { name: 'CitiSent' }, { schemaVersion: 2 })

    const parsed = JSON.parse(window.localStorage.getItem('test.schema'))
    expect(parsed).toEqual({
      schemaVersion: 2,
      payload: { name: 'CitiSent' },
    })
  })

  it('loads values from schema envelope and validates', () => {
    window.localStorage.setItem(
      'test.schema',
      JSON.stringify({
        schemaVersion: 1,
        payload: { count: 4 },
      })
    )

    const result = loadFromStorageWithSchema('test.schema', { count: 0 }, {
      schemaVersion: 2,
      migrate: ({ payload }) => ({ ...payload, migrated: true }),
      validate: (payload) => ({ count: Number(payload.count || 0), migrated: !!payload.migrated }),
    })

    expect(result).toEqual({ count: 4, migrated: true })
  })

  it('loads legacy unversioned values by migrating from version zero', () => {
    window.localStorage.setItem('test.legacy', JSON.stringify({ role: 'Administrator' }))

    const result = loadFromStorageWithSchema('test.legacy', { role: 'Guest' }, {
      schemaVersion: 1,
      migrate: ({ payload, fromVersion }) => ({
        role: payload.role,
        fromVersion,
      }),
    })

    expect(result).toEqual({ role: 'Administrator', fromVersion: 0 })

    const persisted = JSON.parse(window.localStorage.getItem('test.legacy'))
    expect(persisted).toEqual({
      schemaVersion: 1,
      payload: { role: 'Administrator', fromVersion: 0 },
    })
  })

  it('writes back migrated payload when envelope version is outdated', () => {
    window.localStorage.setItem(
      'test.outdated',
      JSON.stringify({
        schemaVersion: 1,
        payload: { mode: 'legacy' },
      })
    )

    const result = loadFromStorageWithSchema('test.outdated', { mode: 'fallback' }, {
      schemaVersion: 2,
      migrate: ({ payload, fromVersion }) => ({
        ...payload,
        upgradedFrom: fromVersion,
      }),
    })

    expect(result).toEqual({ mode: 'legacy', upgradedFrom: 1 })

    const persisted = JSON.parse(window.localStorage.getItem('test.outdated'))
    expect(persisted).toEqual({
      schemaVersion: 2,
      payload: { mode: 'legacy', upgradedFrom: 1 },
    })
  })

  it('returns fallback when malformed json is stored', () => {
    window.localStorage.setItem('test.bad', '{not-json')

    const result = loadFromStorageWithSchema('test.bad', { ok: false }, { schemaVersion: 1 })

    expect(result).toEqual({ ok: false })
  })

  it('returns fallback when migration throws', () => {
    window.localStorage.setItem('test.throw', JSON.stringify({ schemaVersion: 1, payload: { a: 1 } }))

    const result = loadFromStorageWithSchema('test.throw', { a: 0 }, {
      schemaVersion: 2,
      migrate: () => {
        throw new Error('boom')
      },
    })

    expect(result).toEqual({ a: 0 })
  })
})
