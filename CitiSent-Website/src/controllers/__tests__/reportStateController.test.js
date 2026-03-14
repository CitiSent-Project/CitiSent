import { describe, expect, it } from 'vitest'
import {
  buildNextReportStatusMap,
  buildNextSelectedReport,
  buildViewedReport,
} from '../reportStateController'

describe('reportStateController', () => {
  it('builds viewed report with mapped status override', () => {
    const report = { id: 'R-1', status: 'Pending', title: 'Road' }
    const reportStatusMap = { 'R-1': 'Resolved' }

    expect(buildViewedReport({ report, reportStatusMap })).toEqual({
      id: 'R-1',
      status: 'Resolved',
      title: 'Road',
    })
  })

  it('creates next report status map immutably', () => {
    const previous = { 'R-1': 'Pending' }
    const result = buildNextReportStatusMap({
      reportStatusMap: previous,
      reportId: 'R-2',
      nextStatus: 'Under Review',
    })

    expect(result).toEqual({ 'R-1': 'Pending', 'R-2': 'Under Review' })
    expect(previous).toEqual({ 'R-1': 'Pending' })
  })

  it('updates selected report status only when ids match', () => {
    const selectedReport = { id: 'R-7', status: 'Pending' }

    expect(
      buildNextSelectedReport({
        selectedReport,
        reportId: 'R-7',
        nextStatus: 'Resolved',
      })
    ).toEqual({ id: 'R-7', status: 'Resolved' })

    expect(
      buildNextSelectedReport({
        selectedReport,
        reportId: 'R-8',
        nextStatus: 'Resolved',
      })
    ).toEqual({ id: 'R-7', status: 'Pending' })
  })
})
