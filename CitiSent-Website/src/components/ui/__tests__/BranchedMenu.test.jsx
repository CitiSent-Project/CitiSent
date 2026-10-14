/* @vitest-environment jsdom */
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BranchedMenu, { BranchedSubtree } from '../BranchedMenu'

describe('BranchedMenu component', () => {
	let container
	let root

	beforeEach(() => {
		globalThis.IS_REACT_ACT_ENVIRONMENT = true
		container = document.createElement('div')
		document.body.appendChild(container)
		root = createRoot(container)
	})

	afterEach(() => {
		act(() => {
			root.unmount()
		})
		container.remove()
		globalThis.IS_REACT_ACT_ENVIRONMENT = false
	})

	it('renders with default items and allows selecting items', async () => {
		const handleSelect = vi.fn()
		const handleToggle = vi.fn()

		await act(async () => {
			root.render(
				<BranchedMenu
					defaultOpen={[0]}
					onSelect={handleSelect}
					onToggle={handleToggle}
				/>
			)
		})

		// First section should be open
		const buttons = Array.from(container.querySelectorAll('button'))
		const quickStartButton = buttons.find((btn) => btn.textContent?.includes('Quick start'))
		expect(quickStartButton).toBeDefined()

		// Clicking Quick start calls onSelect
		await act(async () => {
			quickStartButton.click()
		})

		expect(handleSelect).toHaveBeenCalledWith('quick', expect.objectContaining({ label: 'Quick start' }))
	})

	it('toggles sections when section header is clicked', async () => {
		const handleToggle = vi.fn()

		await act(async () => {
			root.render(
				<BranchedMenu
					defaultOpen={[]}
					onToggle={handleToggle}
				/>
			)
		})

		const buttons = Array.from(container.querySelectorAll('button'))
		const componentsHeader = buttons.find((btn) => btn.textContent?.includes('Components'))
		expect(componentsHeader).toBeDefined()

		await act(async () => {
			componentsHeader.click()
		})

		expect(handleToggle).toHaveBeenCalledWith(1, true)
	})

	it('renders BranchedSubtree with SVG tree lines and active reach state', async () => {
		const handleSelect = vi.fn()
		const kids = [
			{ value: 'opt-1', label: 'Option 1' },
			{ value: 'opt-2', label: 'Option 2' },
		]

		await act(async () => {
			root.render(
				<BranchedSubtree
					kids={kids}
					active="opt-2"
					onSelect={handleSelect}
				/>
			)
		})

		const svg = container.querySelector('svg.branched-menu__lines')
		expect(svg).toBeDefined()

		const basePaths = container.querySelectorAll('path.branched-menu__base')
		expect(basePaths.length).toBeGreaterThan(0)

		const reachPaths = container.querySelectorAll('path.branched-menu__reach')
		expect(reachPaths.length).toBe(2)

		// Active reach path for opt-2 should have strokeDashoffset 0
		const activePath = reachPaths[1]
		expect(activePath.style.strokeDashoffset).toBe('0')

		// Buttons are rendered and can be clicked
		const buttons = Array.from(container.querySelectorAll('button'))
		const opt1Btn = buttons.find((btn) => btn.textContent?.includes('Option 1'))
		expect(opt1Btn).toBeDefined()

		await act(async () => {
			opt1Btn.click()
		})

		expect(handleSelect).toHaveBeenCalledWith('opt-1', expect.objectContaining({ label: 'Option 1' }))
	})
})
