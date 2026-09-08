import { useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import { getStructuredInputError } from '../../../utils/structuredInputValidation'
import { toSlug } from './utils'

export function CreateDepartmentForm({ onCreateDepartment }) {
    const [form, setForm] = useState({ name: '' })
    const [isCreating, setIsCreating] = useState(false)
    const [formError, setFormError] = useState('')

    function updateForm(field, value) {
        const inputError = getStructuredInputError(value, 'location')
        if (inputError) {
            setFormError(inputError)
            return
        }

        setFormError('')
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }))
    }

    async function handleCreateDepartment(event) {
        event.preventDefault()

        const payload = {
            slug: toSlug(form.name),
            name: String(form.name || '').trim(),
        }

        if (!payload.slug || !payload.name) {
            setFormError('Department name is required.')
            return
        }

        setIsCreating(true)
        const result = await onCreateDepartment(payload)
        setIsCreating(false)

        if (result?.ok) {
            setForm({
                name: '',
            })
            setFormError('')
        }
    }

    return (
        <>
            <form className="mt-4 flex flex-col gap-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-100 sm:flex-row sm:items-end dark:bg-slate-900/40 dark:border-slate-700/60" onSubmit={handleCreateDepartment}>
                <div className="flex-1 min-w-0">
                    <label htmlFor="create-agency-input" className="block mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Department Name
                    </label>
                    <input
                        id="create-agency-input"
                        value={form.name}
                        onChange={(event) => updateForm('name', event.target.value)}
                        placeholder="e.g. City Treasury Office"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 dark:hover:border-slate-600"
                    />
                </div>
                <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full inline-flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] shadow-xs shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto cursor-pointer shrink-0"
                >
                    <FiPlus className="text-xs text-white" />
                    <span>{isCreating ? 'Adding...' : 'Add Department'}</span>
                </button>
            </form>
            {formError ? <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{formError}</p> : null}
        </>
    )
}
