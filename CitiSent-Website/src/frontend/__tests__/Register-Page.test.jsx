import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { RegisterPage } from '../Pages/Register-Page'

vi.mock('../../components/Auth-Ui', () => ({
  AuthPageShell: ({ title, subtitle, footer, children, layout = 'stack' }) => (
    <section data-layout={layout}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
      <div>{footer}</div>
    </section>
  ),
  AuthInputField: ({ id, label, type = 'text', value, placeholder, disabled = false }) => (
    <label htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  ),
  AuthPasswordField: ({ id, label, value, placeholder }) => (
    <label htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="password" defaultValue={value} placeholder={placeholder} />
    </label>
  ),
}))

describe('RegisterPage', () => {
  it('renders the split layout and keeps Assigned Department as the only department field', () => {
    const markup = renderToStaticMarkup(
      <RegisterPage
        onRegister={vi.fn()}
        onSwitchToLogin={vi.fn()}
        departmentOptions={[{ id: 'dept-1', label: 'Public Safety' }]}
      />
    )

    expect(markup).toContain('data-layout="split"')
    expect(markup).toContain('Assigned Department')
    expect(markup).toContain('id="register-department-select"')
    expect(markup).not.toContain('<span>Department</span>')
    expect(markup).toContain('First Name')
    expect(markup).toContain('Last Name')
    expect(markup).toContain('Email')
    expect(markup).toContain('Password')
    expect(markup).toContain('Confirm Password')
  })
})
