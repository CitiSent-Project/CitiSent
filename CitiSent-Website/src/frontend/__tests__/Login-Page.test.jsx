import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LoginPage } from '../Pages/Login-Page'

vi.mock('../../components/Auth-Ui', () => ({
  AuthPageShell: ({ title, subtitle, footer, children }) => (
    <section>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
      <div>{footer}</div>
    </section>
  ),
  AuthInputField: ({ id, label, type = 'text', value, placeholder }) => (
    <label htmlFor={id}>
      <span>{label}</span>
      <input id={id} type={type} defaultValue={value} placeholder={placeholder} />
    </label>
  ),
  AuthPasswordField: ({ id, label, value, placeholder }) => (
    <label htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="password" defaultValue={value} placeholder={placeholder} />
    </label>
  ),
}))

describe('LoginPage', () => {
  it('renders a plain text identifier field so usernames and emails are both allowed', () => {
    const markup = renderToStaticMarkup(
      <LoginPage
        onLogin={vi.fn()}
        onSwitchToRegister={vi.fn()}
        rememberedEmail=""
      />
    )

    expect(markup).toContain('Username or Email')
    expect(markup).toContain('id="login-identifier"')
    expect(markup).toContain('type="text"')
    expect(markup).toContain('Enter your username or email')
    expect(markup).toContain('Remember this sign-in')
  })
})
